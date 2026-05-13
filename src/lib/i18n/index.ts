import { writable, derived } from 'svelte/store';
import { translations, type Language } from './translations';
export type { Language };

function createLangStore() {
  const isBrowser = typeof window !== 'undefined';
  const initialLang = (isBrowser 
    ? localStorage.getItem('lang') || navigator.language.split('-')[0] || 'fr'
    : 'fr') as Language;

  // Fallback to English if language not supported
  const lang = translations[initialLang] ? initialLang : 'en';

  const { subscribe, set } = writable<Language>(lang);

  return {
    subscribe,
    set: (l: Language) => {
      if (translations[l]) {
        if (isBrowser) localStorage.setItem('lang', l);
        set(l);
      }
    }
  };
}

export const lang = createLangStore();

export const t = derived(lang, ($lang) => {
  return translations[$lang] || translations.en;
});
