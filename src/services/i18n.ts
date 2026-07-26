import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English is always needed as fallback — bundle it eagerly.
import enTranslation from '../locales/en.json';

const SUPPORTED_LANGUAGES = [
  // Original 18
  'en', 'fr', 'de', 'el', 'es', 'it', 'pl', 'pt', 'nl', 'sv', 'ru', 'ar', 'zh', 'ja', 'ko', 'tr', 'th', 'vi',
  // South/Southeast Asia
  'hi', 'bn', 'ta', 'te', 'ml', 'mr', 'gu', 'kn', 'pa', 'ur', 'my', 'km', 'lo', 'ms', 'id', 'tl', 'si', 'ne',
  // East Asia
  'zh-TW',
  // Central Asia / Caucasus
  'ka', 'hy', 'az', 'kk', 'uz', 'ky', 'tg', 'mn',
  // Middle East / North Africa
  'fa', 'he', 'ku', 'ps',
  // Sub-Saharan Africa
  'sw', 'am', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'so', 'rw', 'sn', 'ny',
  // European
  'uk', 'bg', 'hr', 'sr', 'sk', 'cs', 'hu', 'ro', 'lt', 'lv', 'et', 'fi', 'da', 'no', 'is', 'ga', 'cy', 'mt', 'sq', 'mk', 'bs', 'be', 'ca', 'gl', 'eu', 'lb',
  // Pacific
  'mi', 'sm', 'to', 'fj',
] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
type TranslationDictionary = Record<string, unknown>;

const SUPPORTED_LANGUAGE_SET = new Set<SupportedLanguage>(SUPPORTED_LANGUAGES);
const loadedLanguages = new Set<SupportedLanguage>();

// Lazy-load only the locale that's actually needed — all others stay out of the bundle.
const localeModules = import.meta.glob<TranslationDictionary>(
  ['../locales/*.json', '!../locales/en.json'],
  { import: 'default' },
);

const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur', 'ps', 'ku']);

function normalizeLanguage(lng: string): SupportedLanguage {
  const raw = (lng || 'en').toLowerCase();
  // Check full tag first (e.g., zh-TW, zh-tw)
  if (SUPPORTED_LANGUAGE_SET.has(raw as SupportedLanguage)) {
    return raw as SupportedLanguage;
  }
  // Normalize zh-Hant / zh-TW variants
  if (raw.startsWith('zh-') && raw !== 'zh-cn') {
    if (SUPPORTED_LANGUAGE_SET.has('zh-TW' as SupportedLanguage)) {
      return 'zh-TW' as SupportedLanguage;
    }
  }
  const base = raw.split('-')[0] || 'en';
  if (SUPPORTED_LANGUAGE_SET.has(base as SupportedLanguage)) {
    return base as SupportedLanguage;
  }
  return 'en';
}

function applyDocumentDirection(lang: string): void {
  const base = lang.split('-')[0] || lang;
  document.documentElement.setAttribute('lang', base === 'zh' ? 'zh-CN' : base);
  if (RTL_LANGUAGES.has(base)) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.removeAttribute('dir');
  }
}

async function ensureLanguageLoaded(lng: string): Promise<SupportedLanguage> {
  const normalized = normalizeLanguage(lng);
  if (loadedLanguages.has(normalized) && i18next.hasResourceBundle(normalized, 'translation')) {
    return normalized;
  }

  let translation: TranslationDictionary;
  if (normalized === 'en') {
    translation = enTranslation as TranslationDictionary;
  } else {
    // Try exact match first, then lowercase variant for case-insensitive filesystems
    const loader = localeModules[`../locales/${normalized}.json`] ?? localeModules[`../locales/${normalized.toLowerCase()}.json`];
    if (!loader) {
      console.warn(`No locale file for "${normalized}", falling back to English`);
      translation = enTranslation as TranslationDictionary;
    } else {
      translation = await loader();
    }
  }

  i18next.addResourceBundle(normalized, 'translation', translation, true, true);
  loadedLanguages.add(normalized);
  return normalized;
}

// Initialize i18n
export async function initI18n(): Promise<void> {
  if (i18next.isInitialized) {
    const currentLanguage = normalizeLanguage(i18next.language || 'en');
    await ensureLanguageLoaded(currentLanguage);
    applyDocumentDirection(i18next.language || currentLanguage);
    return;
  }

  loadedLanguages.add('en');

  await i18next
    .use(LanguageDetector)
    .init({
      resources: {
        en: { translation: enTranslation as TranslationDictionary },
      },
      supportedLngs: [...SUPPORTED_LANGUAGES],
      nonExplicitSupportedLngs: true,
      fallbackLng: 'en',
      debug: import.meta.env.DEV,
      interpolation: {
        escapeValue: false, // not needed for these simple strings
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

  const detectedLanguage = await ensureLanguageLoaded(i18next.language || 'en');
  if (detectedLanguage !== 'en') {
    // Re-trigger translation resolution now that the detected bundle is loaded.
    await i18next.changeLanguage(detectedLanguage);
  }

  applyDocumentDirection(i18next.language || detectedLanguage);
}

// Helper to translate
export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

// Helper to change language
export async function changeLanguage(lng: string): Promise<void> {
  const normalized = await ensureLanguageLoaded(lng);
  await i18next.changeLanguage(normalized);
  applyDocumentDirection(normalized);
  window.location.reload(); // Simple reload to update all components for now
}

// Helper to get current language (normalized to short code)
export function getCurrentLanguage(): string {
  const lang = i18next.language || 'en';
  return lang.split('-')[0]!;
}

export function isRTL(): boolean {
  return RTL_LANGUAGES.has(getCurrentLanguage());
}

export function getLocale(): string {
  const lang = getCurrentLanguage();
  const map: Record<string, string> = {
    en: 'en-US', el: 'el-GR', zh: 'zh-CN', 'zh-TW': 'zh-TW', pt: 'pt-BR',
    ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR', th: 'th-TH', vi: 'vi-VN',
    hi: 'hi-IN', bn: 'bn-BD', ta: 'ta-IN', te: 'te-IN', ml: 'ml-IN',
    mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', pa: 'pa-IN', ur: 'ur-PK',
    fa: 'fa-IR', he: 'he-IL', sw: 'sw-TZ', am: 'am-ET',
  };
  return map[lang] || lang;
}

export const LANGUAGES = [
  // Original 18
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', label: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  // South/Southeast Asia
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'my', label: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'km', label: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', label: 'ລາວ', flag: '🇱🇦' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'si', label: 'සිංහල', flag: '🇱🇰' },
  { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
  // Central Asia / Caucasus
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', label: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'kk', label: 'Қазақ', flag: '🇰🇿' },
  { code: 'uz', label: 'Oʻzbek', flag: '🇺🇿' },
  { code: 'ky', label: 'Кыргыз', flag: '🇰🇬' },
  { code: 'tg', label: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
  // Middle East / North Africa
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'ku', label: 'Kurdî', flag: '🇮🇶' },
  { code: 'ps', label: 'پښتو', flag: '🇦🇫' },
  // Sub-Saharan Africa
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'zu', label: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', label: 'isiXhosa', flag: '🇿🇦' },
  { code: 'af', label: 'Afrikaans', flag: '🇿🇦' },
  { code: 'so', label: 'Soomaali', flag: '🇸🇴' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sn', label: 'chiShona', flag: '🇿🇼' },
  { code: 'ny', label: 'Chichewa', flag: '🇲🇼' },
  // European
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
  { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', label: 'Српски', flag: '🇷🇸' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', label: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', label: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'is', label: 'Íslenska', flag: '🇮🇸' },
  { code: 'ga', label: 'Gaeilge', flag: '🇮🇪' },
  { code: 'cy', label: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'mt', label: 'Malti', flag: '🇲🇹' },
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
  { code: 'mk', label: 'Македонски', flag: '🇲🇰' },
  { code: 'bs', label: 'Bosanski', flag: '🇧🇦' },
  { code: 'be', label: 'Беларуская', flag: '🇧🇾' },
  { code: 'ca', label: 'Català', flag: '🇪🇸' },
  { code: 'gl', label: 'Galego', flag: '🇪🇸' },
  { code: 'eu', label: 'Euskara', flag: '🇪🇸' },
  { code: 'lb', label: 'Lëtzebuergesch', flag: '🇱🇺' },
  // Pacific
  { code: 'mi', label: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'sm', label: 'Gagana Sāmoa', flag: '🇼🇸' },
  { code: 'to', label: 'Lea Fakatonga', flag: '🇹🇴' },
  { code: 'fj', label: 'Vosa Vakaviti', flag: '🇫🇯' },
];
