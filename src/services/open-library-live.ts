/**
 * open-library-live.ts — Fetch trending books from Open Library.
 * Geocodes via author nationality/birth country lookup.
 */

export interface OpenLibraryBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  openLibraryUrl: string;
  lat: number;
  lon: number;
  country: string;
  timestamp: Date;
  changeType: 'trending-daily' | 'trending-weekly' | 'trending-monthly';
}

// Country → approximate center coordinates for geocoding
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United States': [39.8, -98.6], 'United Kingdom': [54.0, -2.0],
  'France': [46.6, 2.2], 'Germany': [51.2, 10.4], 'Spain': [40.5, -3.7],
  'Italy': [42.5, 12.6], 'Russia': [55.8, 37.6], 'China': [35.9, 104.2],
  'Japan': [36.2, 138.3], 'India': [20.6, 78.9], 'Brazil': [-14.2, -51.9],
  'Canada': [56.1, -106.3], 'Australia': [-25.3, 133.8], 'Mexico': [23.6, -102.6],
  'Argentina': [-38.4, -63.6], 'South Korea': [35.9, 127.8], 'Turkey': [39.0, 35.2],
  'Egypt': [26.8, 30.8], 'Nigeria': [9.1, 8.7], 'South Africa': [-30.6, 22.9],
  'Kenya': [-0.02, 37.9], 'Colombia': [4.6, -74.3], 'Peru': [-9.2, -75.0],
  'Chile': [-35.7, -71.5], 'Poland': [51.9, 19.1], 'Netherlands': [52.1, 5.3],
  'Belgium': [50.5, 4.5], 'Sweden': [60.1, 18.6], 'Norway': [60.5, 8.5],
  'Denmark': [56.3, 9.5], 'Finland': [61.9, 25.7], 'Ireland': [53.1, -8.2],
  'Portugal': [39.4, -8.2], 'Greece': [39.1, 21.8], 'Czech Republic': [49.8, 15.5],
  'Austria': [47.5, 14.6], 'Switzerland': [46.8, 8.2], 'Hungary': [47.2, 19.5],
  'Romania': [45.9, 25.0], 'Israel': [31.0, 34.9], 'Iran': [32.4, 53.7],
  'Pakistan': [30.4, 69.3], 'Indonesia': [-0.8, 113.9], 'Philippines': [12.9, 121.8],
  'Thailand': [15.9, 100.9], 'Vietnam': [14.1, 108.3], 'Malaysia': [4.2, 101.9],
  'Singapore': [1.4, 103.8], 'New Zealand': [-40.9, 174.9], 'Iceland': [64.9, -19.0],
  'Cuba': [21.5, -78.0], 'Jamaica': [18.1, -77.3], 'Scotland': [56.5, -4.2],
  'Wales': [52.1, -3.6], 'Morocco': [31.8, -7.1], 'Lebanon': [33.9, 35.9],
  'Afghanistan': [33.9, 67.7], 'Bangladesh': [23.7, 90.4], 'Sri Lanka': [7.9, 80.8],
  'Nepal': [28.4, 84.1], 'Ethiopia': [9.1, 40.5], 'Ghana': [7.9, -1.0],
  'Ukraine': [48.4, 31.2], 'Taiwan': [23.7, 121.0],
};

// Well-known authors → country (avoids API lookups for popular authors)
const KNOWN_AUTHORS: Record<string, string> = {
  'James Clear': 'United States', 'Robert Greene': 'United States',
  'Robert T. Kiyosaki': 'United States', 'Dale Carnegie': 'United States',
  'J. K. Rowling': 'United Kingdom', 'George Orwell': 'United Kingdom',
  'Emily Brontë': 'United Kingdom', 'Charlotte Brontë': 'United Kingdom',
  'Jane Austen': 'United Kingdom', 'Charles Dickens': 'United Kingdom',
  'William Shakespeare': 'United Kingdom', 'Oscar Wilde': 'Ireland',
  'Virginia Woolf': 'United Kingdom', 'Agatha Christie': 'United Kingdom',
  'J.R.R. Tolkien': 'United Kingdom', 'C.S. Lewis': 'United Kingdom',
  'Roald Dahl': 'United Kingdom', 'Neil Gaiman': 'United Kingdom',
  'Terry Pratchett': 'United Kingdom', 'Douglas Adams': 'United Kingdom',
  'Paulo Coelho': 'Brazil', 'Gabriel García Márquez': 'Colombia',
  'Jorge Luis Borges': 'Argentina', 'Isabel Allende': 'Chile',
  'Mario Vargas Llosa': 'Peru', 'Franz Kafka': 'Czech Republic',
  'Fyodor Dostoevsky': 'Russia', 'Leo Tolstoy': 'Russia',
  'Anton Chekhov': 'Russia', 'Alexander Pushkin': 'Russia',
  'Haruki Murakami': 'Japan', 'Yukio Mishima': 'Japan',
  'Banana Yoshimoto': 'Japan', 'Khaled Hosseini': 'Afghanistan',
  'Chinua Achebe': 'Nigeria', 'Chimamanda Ngozi Adichie': 'Nigeria',
  'Ngugi wa Thiong\'o': 'Kenya', 'Naguib Mahfouz': 'Egypt',
  'Albert Camus': 'France', 'Victor Hugo': 'France',
  'Marcel Proust': 'France', 'Gustave Flaubert': 'France',
  'Alexandre Dumas': 'France', 'Jules Verne': 'France',
  'Simone de Beauvoir': 'France', 'Jean-Paul Sartre': 'France',
  'Hermann Hesse': 'Germany', 'Thomas Mann': 'Germany',
  'Günter Grass': 'Germany', 'Friedrich Nietzsche': 'Germany',
  'Umberto Eco': 'Italy', 'Italo Calvino': 'Italy',
  'Elena Ferrante': 'Italy', 'Luigi Pirandello': 'Italy',
  'Miguel de Cervantes': 'Spain', 'Federico García Lorca': 'Spain',
  'Mark Twain': 'United States', 'Ernest Hemingway': 'United States',
  'F. Scott Fitzgerald': 'United States', 'Toni Morrison': 'United States',
  'Maya Angelou': 'United States', 'Stephen King': 'United States',
  'Kurt Vonnegut': 'United States', 'Ray Bradbury': 'United States',
  'John Steinbeck': 'United States', 'Edgar Allan Poe': 'United States',
  'Sylvia Plath': 'United States', 'Walt Whitman': 'United States',
  'Emily Dickinson': 'United States', 'Herman Melville': 'United States',
  'Margaret Atwood': 'Canada', 'Alice Munro': 'Canada',
  'Patrick White': 'Australia', 'Colleen Hoover': 'United States',
  'Brandon Sanderson': 'United States', 'Sarah J. Maas': 'United States',
  'Julia Quinn': 'United States', 'Ryan Holiday': 'United States',
  'Jeff Kinney': 'United States', 'Rick Riordan': 'United States',
  'Dan Brown': 'United States', 'John Grisham': 'United States',
  'James Patterson': 'United States', 'Suzanne Collins': 'United States',
  'Veronica Roth': 'United States', 'Leigh Bardugo': 'Israel',
  'Ali Hazelwood': 'Italy', 'Rebecca Yarros': 'United States',
  'Holly Black': 'United States', 'Cassandra Clare': 'United States',
  'V.E. Schwab': 'United States', 'R.F. Kuang': 'United States',
  'H. D. Carlton': 'United States', 'Ana Huang': 'United States',
  'W. Bruce Cameron': 'United States', 'Sappho': 'Greece',
  'Homer': 'Greece', 'Plato': 'Greece', 'Aristotle': 'Greece',
  'Dante Alighieri': 'Italy', 'Virgil': 'Italy',
  'Sun Tzu': 'China', 'Confucius': 'China', 'Lao Tzu': 'China',
  'Rumi': 'Iran', 'Omar Khayyam': 'Iran', 'Kahlil Gibran': 'Lebanon',
  'Rabindranath Tagore': 'India', 'R.K. Narayan': 'India',
  'Salman Rushdie': 'India', 'Arundhati Roy': 'India',
};

// City → country fallback for author birth_place lookups
const CITY_MAP: Record<string, string> = {
  'London': 'United Kingdom', 'New York': 'United States', 'Paris': 'France',
  'Berlin': 'Germany', 'Moscow': 'Russia', 'Tokyo': 'Japan', 'Beijing': 'China',
  'Delhi': 'India', 'Mumbai': 'India', 'Sydney': 'Australia', 'Toronto': 'Canada',
  'Dublin': 'Ireland', 'Edinburgh': 'Scotland', 'Rome': 'Italy', 'Madrid': 'Spain',
  'Lisbon': 'Portugal', 'Amsterdam': 'Netherlands', 'Stockholm': 'Sweden',
  'Buenos Aires': 'Argentina', 'São Paulo': 'Brazil', 'Cairo': 'Egypt',
  'Lagos': 'Nigeria', 'Nairobi': 'Kenya', 'Cape Town': 'South Africa',
  'Warsaw': 'Poland', 'Prague': 'Czech Republic', 'Vienna': 'Austria',
  'Istanbul': 'Turkey', 'Tehran': 'Iran', 'Kabul': 'Afghanistan',
  'Chicago': 'United States', 'Los Angeles': 'United States',
  'San Francisco': 'United States', 'Boston': 'United States',
  'Philadelphia': 'United States', 'Washington': 'United States',
  'Atlanta': 'United States', 'Houston': 'United States',
  'Seattle': 'United States', 'Portland': 'United States',
  'Denver': 'United States', 'Minneapolis': 'United States',
  'Montreal': 'Canada', 'Vancouver': 'Canada',
  'Melbourne': 'Australia', 'Brisbane': 'Australia',
  'Manchester': 'United Kingdom', 'Birmingham': 'United Kingdom',
  'Glasgow': 'Scotland', 'Oxford': 'United Kingdom',
  'Cambridge': 'United Kingdom', 'Bristol': 'United Kingdom',
  'Helsinki': 'Finland', 'Oslo': 'Norway', 'Copenhagen': 'Denmark',
};

// Add jitter to prevent stacking at exact same coordinates
function jitter(coord: number, range = 3): number {
  return coord + (Math.random() - 0.5) * range;
}

const CACHE_KEY = 'open-library-trending-cache';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function getCached(): OpenLibraryBook[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.books.map((b: OpenLibraryBook) => ({
      ...b,
      timestamp: new Date(b.timestamp),
    }));
  } catch {
    return null;
  }
}

function setCache(books: OpenLibraryBook[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      books,
    }));
  } catch { /* storage full */ }
}

async function lookupAuthorCountry(authorName: string): Promise<string | null> {
  // Check known authors first (no API call needed)
  if (KNOWN_AUTHORS[authorName]) return KNOWN_AUTHORS[authorName];

  // Try Open Library author search
  try {
    const resp = await fetch(
      `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}&limit=1`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const author = data.docs?.[0];
    if (!author) return null;

    const birthPlace: string = author.birth_place ?? '';
    // Match against known countries
    for (const country of Object.keys(COUNTRY_COORDS)) {
      if (birthPlace.includes(country)) return country;
    }
    // Match against known cities
    for (const [city, country] of Object.entries(CITY_MAP)) {
      if (birthPlace.includes(city)) return country;
    }

    return null;
  } catch {
    return null;
  }
}

interface TrendingWork {
  title?: string;
  author_name?: string[];
  key?: string;
  cover_i?: number;
  first_publish_year?: number;
}

export async function fetchOpenLibraryLive(): Promise<OpenLibraryBook[]> {
  const cached = getCached();
  if (cached) return cached;

  try {
    // Fetch daily trending books
    const resp = await fetch('https://openlibrary.org/trending/daily.json?limit=40');
    if (!resp.ok) {
      console.warn('[OpenLibraryTrending] API returned', resp.status);
      return [];
    }

    const data = await resp.json();
    const works: TrendingWork[] = data.works ?? [];
    const books: OpenLibraryBook[] = [];
    const seen = new Set<string>();

    for (const work of works) {
      const title = work.title;
      const authorName = work.author_name?.[0];
      const key = work.key;
      if (!title || !authorName || !key || seen.has(key)) continue;
      seen.add(key);

      const country = await lookupAuthorCountry(authorName);
      if (!country || !COUNTRY_COORDS[country]) continue;

      const [baseLat, baseLon] = COUNTRY_COORDS[country];

      books.push({
        id: key,
        title,
        author: authorName,
        coverUrl: work.cover_i
          ? `https://covers.openlibrary.org/b/id/${work.cover_i}-S.jpg`
          : undefined,
        openLibraryUrl: `https://openlibrary.org${key}`,
        lat: jitter(baseLat),
        lon: jitter(baseLon),
        country,
        timestamp: new Date(),
        changeType: 'trending-daily',
      });
    }

    setCache(books);
    console.log(`[OpenLibraryTrending] ${books.length} trending books geocoded`);
    return books;
  } catch (error) {
    console.error('[OpenLibraryTrending] Fetch failed:', error);
    return [];
  }
}
