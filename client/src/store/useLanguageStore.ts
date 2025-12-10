import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

type Language = 'en' | 'hi';

type TranslationKeys = typeof en;

interface LanguageState {
  language: Language;
  translations: TranslationKeys;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, TranslationKeys> = {
  en,
  hi,
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      translations: en,

      setLanguage: (lang: Language) => {
        set({
          language: lang,
          translations: translations[lang],
        });
        console.log(`🌐 Language changed to: ${lang === 'en' ? 'English' : 'हिंदी'}`);
      },

      toggleLanguage: () => {
        const currentLang = get().language;
        const newLang = currentLang === 'en' ? 'hi' : 'en';
        set({
          language: newLang,
          translations: translations[newLang],
        });
        console.log(`🌐 Language toggled to: ${newLang === 'en' ? 'English' : 'हिंदी'}`);
      },

      // Helper function to get nested translation by dot notation
      // e.g., t('nav.dashboard') returns 'Dashboard' or 'डैशबोर्ड'
      t: (key: string): string => {
        const keys = key.split('.');
        let value: any = get().translations;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key;
          }
        }
        
        return typeof value === 'string' ? value : key;
      },
    }),
    {
      name: 'drillsense-language',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.translations = translations[state.language];
        }
      },
    }
  )
);

// Custom hook for easy translation access
export const useTranslation = () => {
  const { t, language, toggleLanguage, setLanguage } = useLanguageStore();
  return { t, language, toggleLanguage, setLanguage };
};
