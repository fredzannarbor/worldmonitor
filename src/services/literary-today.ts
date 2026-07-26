/**
 * literary-today.ts — Fetch authors born/died on today's date from Wikidata.
 * Returns geolocated author markers for the books variant map.
 */

export interface LiteraryTodayAuthor {
  id: string;
  name: string;
  birthYear?: number;
  deathYear?: number;
  event: 'born' | 'died';
  eventMonth?: number;
  eventDay?: number;
  lat: number;
  lon: number;
  placeName: string;
  description?: string;
  imageUrl?: string;
  wikipediaUrl?: string;
}

const CACHE_KEY = 'literary-today-cache';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

/** Return [month, day] pairs for today +/- dayRange (default 2 → 5-day window). */
function getDateWindow(dayRange = 2): Array<[string, string]> {
  const dates: Array<[string, string]> = [];
  const now = new Date();
  for (let offset = -dayRange; offset <= dayRange; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    dates.push([
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ]);
  }
  return dates;
}

function getCacheKey(): string {
  const dates = getDateWindow();
  return dates.map(([m, d]) => `${m}-${d}`).join('_');
}

function buildSparqlQuery(dates: Array<[string, string]>): string {
  // Build a FILTER that matches any date in the window
  const dateFilter = dates
    .map(([mm, dd]) => `(MONTH(?date) = ${parseInt(mm)} && DAY(?date) = ${parseInt(dd)})`)
    .join(' || ');

  return `
SELECT DISTINCT ?person ?personLabel ?birthYear ?deathYear ?event ?eventMonth ?eventDay ?lat ?lon ?placeLabel ?image ?article WHERE {
  {
    # Born in date window
    ?person wdt:P569 ?date .
    FILTER(${dateFilter})
    ?person wdt:P19 ?place .
    ?place wdt:P625 ?coord .
    BIND("born" AS ?event)
    BIND(YEAR(?date) AS ?birthYear)
    BIND(MONTH(?date) AS ?eventMonth)
    BIND(DAY(?date) AS ?eventDay)
    OPTIONAL { ?person wdt:P570 ?deathDate . BIND(YEAR(?deathDate) AS ?deathYear) }
  } UNION {
    # Died in date window
    ?person wdt:P570 ?date .
    FILTER(${dateFilter})
    ?person wdt:P20 ?place .
    ?place wdt:P625 ?coord .
    BIND("died" AS ?event)
    BIND(YEAR(?date) AS ?deathYear)
    BIND(MONTH(?date) AS ?eventMonth)
    BIND(DAY(?date) AS ?eventDay)
    OPTIONAL { ?person wdt:P569 ?birthDate2 . BIND(YEAR(?birthDate2) AS ?birthYear) }
  }
  # Must be a writer/author/poet/novelist/playwright
  ?person wdt:P106 ?occupation .
  ?occupation wdt:P279* wd:Q36180 .  # writer (includes subclasses: novelist, poet, etc.)
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)
  OPTIONAL { ?person wdt:P18 ?image }
  OPTIONAL {
    ?article schema:about ?person ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,de,es,ja,zh,ru,ar" }
}
ORDER BY DESC(?deathYear) DESC(?birthYear)
LIMIT 300
`.trim();
}

function getCached(): LiteraryTodayAuthor[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    if (parsed.dateKey !== getCacheKey()) return null;
    return parsed.authors;
  } catch {
    return null;
  }
}

function setCache(authors: LiteraryTodayAuthor[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      dateKey: getCacheKey(),
      authors,
    }));
  } catch { /* storage full */ }
}

export async function fetchLiteraryToday(): Promise<LiteraryTodayAuthor[]> {
  const cached = getCached();
  if (cached) return cached;

  const dates = getDateWindow();
  const query = buildSparqlQuery(dates);
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
    });

    if (!resp.ok) {
      console.warn('[LiteraryToday] Wikidata query failed:', resp.status);
      return [];
    }

    const data = await resp.json();
    const seen = new Set<string>();
    const authors: LiteraryTodayAuthor[] = [];

    for (const row of data.results?.bindings ?? []) {
      const personId = row.person?.value?.split('/').pop() ?? '';
      const event = row.event?.value as 'born' | 'died';
      const dedupeKey = `${personId}-${event}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const lat = parseFloat(row.lat?.value);
      const lon = parseFloat(row.lon?.value);
      if (isNaN(lat) || isNaN(lon)) continue;

      authors.push({
        id: dedupeKey,
        name: row.personLabel?.value ?? 'Unknown',
        birthYear: row.birthYear?.value ? parseInt(row.birthYear.value) : undefined,
        deathYear: row.deathYear?.value ? parseInt(row.deathYear.value) : undefined,
        event,
        eventMonth: row.eventMonth?.value ? parseInt(row.eventMonth.value) : undefined,
        eventDay: row.eventDay?.value ? parseInt(row.eventDay.value) : undefined,
        lat,
        lon,
        placeName: row.placeLabel?.value ?? '',
        imageUrl: row.image?.value,
        wikipediaUrl: row.article?.value,
      });
    }

    setCache(authors);
    const dateRange = dates.map(([m, d]) => `${m}-${d}`).join(', ');
    console.log(`[LiteraryToday] ${authors.length} authors found for dates: ${dateRange}`);
    return authors;
  } catch (error) {
    console.error('[LiteraryToday] Fetch failed:', error);
    return [];
  }
}
