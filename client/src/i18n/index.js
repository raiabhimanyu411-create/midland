import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import arJO from './locales/ar-JO.json';
import arEG from './locales/ar-EG.json';
import pl from './locales/pl.json';

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
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && supportedLanguages.some((lang) => lang.code === stored)) return stored;

  const browserLanguage = window.navigator.language || 'en';
  const match = supportedLanguages.find((lang) => browserLanguage.toLowerCase().startsWith(lang.code.toLowerCase()));
  return match ? match.code : 'en';
}

export function applyDocumentDirection(languageCode) {
  document.documentElement.lang = languageCode;
  document.documentElement.dir = isRtlLanguage(languageCode) ? 'rtl' : 'ltr';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    'ar-JO': { translation: arJO },
    'ar-EG': { translation: arEG },
    pl: { translation: pl }
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false
});

i18n.on('languageChanged', (languageCode) => {
  window.localStorage.setItem(STORAGE_KEY, languageCode);
  applyDocumentDirection(languageCode);
});

applyDocumentDirection(i18n.language);

export default i18n;
