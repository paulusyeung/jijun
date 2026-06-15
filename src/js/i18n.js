import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const SUPPORTED_LANGS = ['en', 'zh-TW', 'zh-CN'];

let ready = false;

export async function initI18n() {
  if (ready) return;
  ready = true;

  await i18next.use(HttpBackend).use(LanguageDetector).init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => {
        if (lng === 'zh-CN' || lng === 'zh-SG') return 'zh-CN';
        if (lng === 'zh-HK') return 'zh-TW';
        if (lng.startsWith('zh')) return 'zh-TW';
        if (lng.startsWith('en')) return 'en';
        return 'en';
      },
    },
    interpolation: { escapeValue: false },
    ns: ['common', 'categories', 'errors', 'home', 'add', 'settings', 'records', 'stats', 'ledger', 'accounts', 'debts', 'recurring', 'amortizations', 'plugins', 'sync'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

  document.documentElement.lang = i18next.language;
  translateStaticContent();
}

function translateStaticContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.dataset.i18nAlt;
    el.alt = t(key);
  });
  document.title = t('appNameFull');
}

i18next.on('languageChanged', () => {
  translateStaticContent();
});

export function t(key, options) {
  return i18next.t(key, options);
}

export function changeLanguage(lng) {
  i18next.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
  document.dispatchEvent(new CustomEvent('app:languageChanged'));
}

export function getCurrentLanguage() {
  return i18next.language;
}

export function getSupportedLanguages() {
  return SUPPORTED_LANGS;
}

export { i18next };
