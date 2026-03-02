/**
 * generate-book-digests.mts — Daily script to generate book digest JSON files.
 *
 * Uses Claude Max (via claude CLI) to generate a curated digest of articles
 * for each book/publishing category. Output is written to public/data/book-digests/.
 *
 * Usage:
 *   npx tsx scripts/generate-book-digests.mts [--lang en,fr,de] [--all-langs] [--dry-run]
 *
 * Options:
 *   --lang <codes>   Comma-separated language codes to generate (default: en)
 *   --all-langs      Generate for all supported languages
 *   --dry-run        Show what would be generated without writing
 *
 * Intended to be run once per day via cron or manually.
 * The browser loads these static JSON files — no runtime LLM calls needed.
 *
 * Format: Each category contains articles[] with date, title, summary,
 * keyFacts[], comment, citation, and link. Articles are kept for 5 days,
 * then moved to archive/{lang}/{date}.json.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = resolve(__dirname, '../public/data/book-digests');
const ARCHIVE_DIR = resolve(OUTPUT_DIR, 'archive');

/** Number of days of articles to keep in the main digest file */
const KEEP_DAYS = 5;

const CATEGORIES = [
  {
    key: 'publishing-news',
    title: 'Publishing News',
    prompt: 'major publishing industry news, publisher mergers, book sales data, print vs digital trends, bookstore developments',
  },
  {
    key: 'book-reviews',
    title: 'Book Reviews',
    prompt: 'notable new book reviews, bestseller highlights, critically acclaimed recent releases, debut author reviews',
  },
  {
    key: 'literary-awards',
    title: 'Literary Awards',
    prompt: 'literary prize announcements, award nominations, shortlists, winner announcements, new literary prizes',
  },
  {
    key: 'industry-analysis',
    title: 'Industry Analysis',
    prompt: 'book industry analysis, AI in publishing, audiobook market trends, self-publishing statistics, BookTok impact, library funding',
  },
  {
    key: 'global-literacy',
    title: 'Global Literacy',
    prompt: 'global literacy rates, reading programs, UNESCO education initiatives, library access, digital literacy, reading research',
  },
  {
    key: 'author-spotlights',
    title: 'Author Spotlights',
    prompt: 'author interviews, new book announcements from established authors, debut author profiles, literary events, author milestones',
  },
];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', hi: 'Hindi', ru: 'Russian', tr: 'Turkish', sv: 'Swedish',
  pl: 'Polish', el: 'Greek',
};

interface DigestArticle {
  date: string;
  title: string;
  summary: string;
  keyFacts: string[];
  comment: string;
  citation: string;
  link: string;
}

interface DigestCategory {
  title: string;
  articles: DigestArticle[];
}

interface DigestFile {
  generated: string;
  language: string;
  currentDate: string;
  categories: Record<string, DigestCategory>;
  archive: Record<string, unknown>;
}

function generatePrompt(lang: string): string {
  const langName = LANGUAGE_NAMES[lang] || lang;
  const today = new Date().toISOString().split('T')[0];
  const categoryDescriptions = CATEGORIES.map(
    c => `  - "${c.key}" (title: "${c.title}"): ${c.prompt}`
  ).join('\n');

  const langInstruction = lang === 'en'
    ? 'Write all titles, summaries, comments, keyFacts, and citations in English.'
    : `Write all titles, summaries, comments, keyFacts, and citations in ${langName}. Keep JSON keys in English. URLs should point to ${langName}-language sources when possible, otherwise use English sources.`;

  return `Generate a JSON digest of today's top book and publishing news for ${today}.

For each of the following 6 categories, provide exactly 1 article with a real, plausible URL to an actual publication website:
${categoryDescriptions}

${langInstruction}

Each article needs:
- "date": "${today}"
- "title": A specific, informative headline (not generic)
- "summary": One sentence with specific details (numbers, names, dates). ~20 words max.
- "keyFacts": Array of exactly 2 short bullet-point facts
- "comment": A pithy, opinionated editorial comment. One sentence, wry tone.
- "citation": Name of the source publication (e.g. "Publishers Weekly", "UNESCO")
- "link": A plausible URL to a real publication

Each article should be ~50 words total across all text fields.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "categories": {
    "publishing-news": { "title": "Publishing News", "articles": [{ "date": "${today}", "title": "...", "summary": "...", "keyFacts": ["...", "..."], "comment": "...", "citation": "...", "link": "..." }] },
    "book-reviews": { "title": "Book Reviews", "articles": [...] },
    "literary-awards": { "title": "Literary Awards", "articles": [...] },
    "industry-analysis": { "title": "Industry Analysis", "articles": [...] },
    "global-literacy": { "title": "Global Literacy", "articles": [...] },
    "author-spotlights": { "title": "Author Spotlights", "articles": [...] }
  }
}`;
}

/**
 * Load an existing digest file, or return undefined if it doesn't exist.
 */
function loadExistingDigest(filePath: string): DigestFile | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DigestFile;
  } catch {
    return undefined;
  }
}

/**
 * Get the cutoff date string (YYYY-MM-DD) for articles to keep.
 * Articles older than this should be archived.
 */
function getCutoffDate(today: string, keepDays: number): string {
  const d = new Date(today + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - keepDays + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Merge new articles into existing digest, trim old articles to archive.
 */
function mergeAndArchive(
  existing: DigestFile | undefined,
  newCategories: Record<string, DigestCategory>,
  lang: string,
  today: string,
): DigestFile {
  const cutoff = getCutoffDate(today, KEEP_DAYS);
  const result: DigestFile = {
    generated: new Date().toISOString(),
    language: lang,
    currentDate: today,
    categories: {},
    archive: existing?.archive ?? {},
  };

  // Collect all category keys from both sources
  const allKeys = new Set([
    ...Object.keys(newCategories),
    ...Object.keys(existing?.categories ?? {}),
  ]);

  const articlesToArchive: DigestArticle[] = [];

  for (const key of allKeys) {
    const existingCat = existing?.categories[key];
    const newCat = newCategories[key];
    const title = newCat?.title ?? existingCat?.title ?? key;

    // Combine: new articles first (today), then existing
    const allArticles: DigestArticle[] = [
      ...(newCat?.articles ?? []),
      ...(existingCat?.articles ?? []),
    ];

    // Deduplicate by title (in case of re-runs on the same day)
    const seen = new Set<string>();
    const deduped: DigestArticle[] = [];
    for (const a of allArticles) {
      if (!seen.has(a.title)) {
        seen.add(a.title);
        deduped.push(a);
      }
    }

    // Split into keep vs archive
    const keep: DigestArticle[] = [];
    for (const a of deduped) {
      if (a.date >= cutoff) {
        keep.push(a);
      } else {
        articlesToArchive.push(a);
      }
    }

    result.categories[key] = { title, articles: keep };
  }

  // Write archived articles to per-date files
  if (articlesToArchive.length > 0) {
    const langArchiveDir = resolve(ARCHIVE_DIR, lang);
    if (!existsSync(langArchiveDir)) {
      mkdirSync(langArchiveDir, { recursive: true });
    }

    // Group by date
    const byDate: Record<string, DigestArticle[]> = {};
    for (const a of articlesToArchive) {
      (byDate[a.date] ??= []).push(a);
    }

    for (const [date, articles] of Object.entries(byDate)) {
      const archiveFile = resolve(langArchiveDir, `${date}.json`);
      // Merge with any existing archive for that date
      let existing: DigestArticle[] = [];
      if (existsSync(archiveFile)) {
        try {
          existing = JSON.parse(readFileSync(archiveFile, 'utf-8'));
        } catch {
          // ignore corrupt archive files
        }
      }
      const merged = [...existing, ...articles];
      writeFileSync(archiveFile, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
      console.log(`  Archived ${articles.length} articles to ${archiveFile}`);
    }
  }

  return result;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const allLangs = args.includes('--all-langs');
  const langIdx = args.indexOf('--lang');
  const langFilter = langIdx !== -1 ? (args[langIdx + 1]?.split(',') ?? ['en']) : ['en'];

  const targets = allLangs ? Object.keys(LANGUAGE_NAMES) : langFilter;

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Languages: ${targets.join(', ')}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  for (const lang of targets) {
    const outFile = resolve(OUTPUT_DIR, `${lang}.json`);
    const langName = LANGUAGE_NAMES[lang] ?? lang;

    if (dryRun) {
      console.log(`[DRY RUN] Would generate: ${outFile} (${langName})`);
      continue;
    }

    console.log(`Generating digest for ${langName} (${lang})...`);

    const prompt = generatePrompt(lang);
    const today = new Date().toISOString().split('T')[0];

    try {
      // Use Claude CLI (Claude Max) to generate the digest
      // execFileSync avoids shell injection — prompt is passed as a safe argument
      const result = execFileSync(
        'claude',
        ['--print', prompt],
        {
          encoding: 'utf-8',
          timeout: 120000,
          maxBuffer: 1024 * 1024,
        }
      );

      // Extract JSON from the response (handle potential markdown wrapping)
      let json = result.trim();
      const jsonMatch = json.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        json = jsonMatch[0];
      }

      // Parse the new articles
      const parsed = JSON.parse(json) as { categories: Record<string, DigestCategory> };
      if (!parsed.categories || Object.keys(parsed.categories).length !== 6) {
        console.error(`  [ERROR] Invalid structure for ${lang}, expected 6 categories`);
        continue;
      }

      // Validate each category has articles
      for (const [key, cat] of Object.entries(parsed.categories)) {
        if (!cat.articles || cat.articles.length < 1) {
          console.error(`  [ERROR] Category "${key}" has no articles`);
        }
      }

      // Load existing, merge, and archive old articles
      const existing = loadExistingDigest(outFile);
      const merged = mergeAndArchive(existing, parsed.categories, lang, today);

      writeFileSync(outFile, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
      console.log(`  Written: ${outFile}`);

      // Summary
      for (const [key, cat] of Object.entries(merged.categories)) {
        const dates = [...new Set(cat.articles.map(a => a.date))].sort().reverse();
        console.log(`    ${key}: ${cat.articles.length} articles across ${dates.length} day(s)`);
      }
    } catch (err) {
      console.error(`  [ERROR] Failed to generate ${lang}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('\nDone!');
}

main();
