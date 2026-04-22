// ---------------------------------------------------------------------------
// i18n/index.ts — Sprint 7 a11y+i18n
//
// Setup i18next per IT (primario) + EN (secondario). Detection automatica
// via localStorage + navigator, fallback a IT.
//
// Le traduzioni vivono in src/i18n/locales/{it,en}.ts.
// Uso nei componenti: `const { t } = useTranslation(); t('inbox.title')`
// ---------------------------------------------------------------------------
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import it from './locales/it';

// Scelta di prodotto: GSI e' consegnato in italiano. L'infrastruttura i18n
// (locale en.ts, LanguageDetector) resta in codice per riabilitazione
// futura, ma al momento forziamo lingua IT e nessun detection automatico.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: 'it', // forzata
    fallbackLng: 'it',
    supportedLngs: ['it'],
    interpolation: {
      escapeValue: false, // React già escape
    },
    detection: {
      order: ['localStorage'],
      caches: [],
      lookupLocalStorage: 'gsi-lang',
    },
  });

export default i18n;
