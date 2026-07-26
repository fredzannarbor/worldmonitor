/**
 * generate-locales.mts — One-time script to generate locale translation files.
 *
 * Reads src/locales/en.json as the source, then uses Claude Max (via Task tool
 * or direct invocation) to translate all keys for each target language.
 *
 * Usage:
 *   npx tsx scripts/generate-locales.mts [--lang fr,de,es] [--all] [--dry-run]
 *
 * Options:
 *   --lang <codes>  Comma-separated language codes to generate (default: all new)
 *   --all           Regenerate all languages (overwrites existing)
 *   --dry-run       Show which files would be created without writing
 *
 * This script runs once, then locale files are committed and maintained manually.
 * No runtime LLM calls are needed — translations are static assets.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES_DIR = resolve(__dirname, '../src/locales');
const EN_FILE = resolve(LOCALES_DIR, 'en.json');

// All supported language codes (minus 'en' which is the source)
const ALL_LANGUAGES = [
  'fr', 'de', 'el', 'es', 'it', 'pl', 'pt', 'nl', 'sv', 'ru', 'ar', 'zh', 'ja', 'ko', 'tr', 'th', 'vi',
  'hi', 'bn', 'ta', 'te', 'ml', 'mr', 'gu', 'kn', 'pa', 'ur', 'my', 'km', 'lo', 'ms', 'id', 'tl', 'si', 'ne',
  'zh-TW',
  'ka', 'hy', 'az', 'kk', 'uz', 'ky', 'tg', 'mn',
  'fa', 'he', 'ku', 'ps',
  'sw', 'am', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'so', 'rw', 'sn', 'ny',
  'uk', 'bg', 'hr', 'sr', 'sk', 'cs', 'hu', 'ro', 'lt', 'lv', 'et', 'fi', 'da', 'no', 'is', 'ga', 'cy', 'mt', 'sq', 'mk', 'bs', 'be', 'ca', 'gl', 'eu', 'lb',
  'mi', 'sm', 'to', 'fj',
];

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French', de: 'German', el: 'Greek', es: 'Spanish', it: 'Italian',
  pl: 'Polish', pt: 'Portuguese', nl: 'Dutch', sv: 'Swedish', ru: 'Russian',
  ar: 'Arabic', zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean',
  tr: 'Turkish', th: 'Thai', vi: 'Vietnamese',
  hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', pa: 'Punjabi', ur: 'Urdu',
  my: 'Burmese', km: 'Khmer', lo: 'Lao', ms: 'Malay', id: 'Indonesian',
  tl: 'Tagalog', si: 'Sinhala', ne: 'Nepali', 'zh-TW': 'Traditional Chinese',
  ka: 'Georgian', hy: 'Armenian', az: 'Azerbaijani', kk: 'Kazakh',
  uz: 'Uzbek', ky: 'Kyrgyz', tg: 'Tajik', mn: 'Mongolian',
  fa: 'Persian', he: 'Hebrew', ku: 'Kurdish', ps: 'Pashto',
  sw: 'Swahili', am: 'Amharic', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo',
  zu: 'Zulu', xh: 'Xhosa', af: 'Afrikaans', so: 'Somali', rw: 'Kinyarwanda',
  sn: 'Shona', ny: 'Chichewa',
  uk: 'Ukrainian', bg: 'Bulgarian', hr: 'Croatian', sr: 'Serbian',
  sk: 'Slovak', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian',
  lt: 'Lithuanian', lv: 'Latvian', et: 'Estonian', fi: 'Finnish',
  da: 'Danish', no: 'Norwegian', is: 'Icelandic', ga: 'Irish',
  cy: 'Welsh', mt: 'Maltese', sq: 'Albanian', mk: 'Macedonian',
  bs: 'Bosnian', be: 'Belarusian', ca: 'Catalan', gl: 'Galician',
  eu: 'Basque', lb: 'Luxembourgish',
  mi: 'Māori', sm: 'Samoan', to: 'Tongan', fj: 'Fijian',
};

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const langIdx = args.indexOf('--lang');
  const langFilter = langIdx !== -1 ? args[langIdx + 1]?.split(',') : null;

  const enContent = JSON.parse(readFileSync(EN_FILE, 'utf-8'));

  const targets = langFilter
    ? ALL_LANGUAGES.filter(l => langFilter.includes(l))
    : all
      ? ALL_LANGUAGES
      : ALL_LANGUAGES.filter(l => !existsSync(resolve(LOCALES_DIR, `${l}.json`)));

  console.log(`Source: ${EN_FILE}`);
  console.log(`Target languages: ${targets.length}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  if (targets.length === 0) {
    console.log('All locale files already exist. Use --all to regenerate.');
    return;
  }

  for (const lang of targets) {
    const outFile = resolve(LOCALES_DIR, `${lang}.json`);
    const langName = LANGUAGE_NAMES[lang] ?? lang;

    if (dryRun) {
      console.log(`[DRY RUN] Would create: ${outFile} (${langName})`);
      continue;
    }

    // For now, write a placeholder with the English content
    // In production, this would call Claude Max for translation
    console.log(`Creating placeholder: ${outFile} (${langName})`);
    console.log(`  → To translate, run: claude "Translate this JSON to ${langName}, preserving keys and {{interpolation}} variables" < ${EN_FILE} > ${outFile}`);
    writeFileSync(outFile, JSON.stringify(enContent, null, 2) + '\n', 'utf-8');
  }

  console.log('');
  console.log('Done! Locale placeholder files created.');
  console.log('To translate them with Claude Max, use the claude CLI:');
  console.log('  for lang in fr de es ...; do');
  console.log(`    claude "Translate the JSON values to $lang. Keep keys in English. Preserve {{}} interpolation variables." < src/locales/en.json > src/locales/$lang.json`);
  console.log('  done');
}

main();
