import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { readStorage, writeStorage } from '../utils/storage.js';

export const STORAGE_KEY = 'midland_lang';

export const supportedLanguages = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'ar-JO', label: 'Arabic (Jordan)', nativeLabel: 'العربية (الأردن)', dir: 'rtl' },
  { code: 'ar-EG', label: 'Arabic (Egypt)', nativeLabel: 'العربية (مصر)', dir: 'rtl' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', dir: 'ltr' }
];

const rtlLanguages = new Set(supportedLanguages.filter((lang) => lang.dir === 'rtl').map((lang) => lang.code));

export function isRtlLanguage(code) {
  return rtlLanguages.has(code);
}

function detectLanguage() {
  const stored = readStorage(STORAGE_KEY);
  if (stored && supportedLanguages.some((lang) => lang.code === stored)) return stored;

  const browserLanguage = (window.navigator.language || 'en').toLowerCase();
  const exact = supportedLanguages.find((lang) => lang.code.toLowerCase() === browserLanguage);
  if (exact) return exact.code;
  const baseLanguage = browserLanguage.split('-')[0];
  const base = supportedLanguages.find((lang) => lang.code.toLowerCase() === baseLanguage);
  return base ? base.code : 'en';
}

export function applyDocumentDirection(languageCode) {
  document.documentElement.lang = languageCode;
  document.documentElement.dir = isRtlLanguage(languageCode) ? 'rtl' : 'ltr';
}

// Read the saved/browser language before init, which may emit languageChanged('en') and overwrite storage.
const preferredLanguage = detectLanguage();

i18n.use(initReactI18next).init({
  // Only English is bundled; other languages are fetched on demand to keep the first load small.
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false
});

i18n.on('languageChanged', (languageCode) => {
  writeStorage(STORAGE_KEY, languageCode);
  applyDocumentDirection(languageCode);
});

const localeLoaders = {
  ar: () => import('./locales/ar.json'),
  'ar-JO': () => import('./locales/ar-JO.json'),
  'ar-EG': () => import('./locales/ar-EG.json'),
  pl: () => import('./locales/pl.json')
};

async function ensureLanguageLoaded(code) {
  if (i18n.hasResourceBundle(code, 'translation') || !localeLoaders[code]) return;
  const module = await localeLoaders[code]();
  i18n.addResourceBundle(code, 'translation', module.default, true, true);
}

export async function changeLanguage(code) {
  try {
    await ensureLanguageLoaded(code);
    await i18n.changeLanguage(code);
  } catch {
    await i18n.changeLanguage('en');
  }
}

// Resolves once the visitor's preferred language is ready, so the first render is already translated.
export const i18nReady = (async () => {
  if (preferredLanguage !== 'en') await changeLanguage(preferredLanguage);
  applyDocumentDirection(i18n.language);
})();

export default i18n;
