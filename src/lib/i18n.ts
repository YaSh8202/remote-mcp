import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  // Load translation using http -> see /public/locales
  // Learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Initialize i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Debug mode for development
    debug: false,
    
    // Common namespace used around the full app
    ns: ['common', 'settings'],
    defaultNS: 'common',
    
    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'language',
      lookupCookie: 'language',
      
      // Cache user language
      caches: ['localStorage', 'cookie'],
      
      // Exclude certain languages from being detected
      excludeCacheFor: ['cimode'], // cimode = test mode
    },
    
    // Backend options for loading translations
    backend: {
      // Path where resources get loaded from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      
      // Path to post missing resources
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
    
    interpolation: {
      // Not needed for react as it escapes by default
      escapeValue: false,
    },
    
    // React specific options
    react: {
      // Use suspense for loading translations
      useSuspense: false,
    },
  });

export default i18n;
