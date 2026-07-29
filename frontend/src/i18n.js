import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translation using http -> see /public/locales
  .use(HttpBackend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi'],
    debug: false,

    // default namespace
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'editor', 'viewer', 'share', 'validation', 'notification'],

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'letters_lang',
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
