import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'cyber' | 'paper' | 'ocean';

function createThemeStore() {
  const isBrowser = typeof window !== 'undefined';
  const initialTheme = (isBrowser 
    ? localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : 'light') as ThemeMode;

  const { subscribe, set, update } = writable<ThemeMode>(initialTheme);

  const themes: ThemeMode[] = ['light', 'dark', 'cyber', 'paper', 'ocean'];

  const applyTheme = (newTheme: ThemeMode) => {
    if (isBrowser) {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return {
    subscribe,
    set: (newTheme: ThemeMode) => {
      applyTheme(newTheme);
      set(newTheme);
    },
    toggle: () => update(currentTheme => {
      const currentIndex = themes.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const newTheme = themes[nextIndex];
      applyTheme(newTheme);
      return newTheme;
    }),
    init: () => {
      if (isBrowser) {
        const savedTheme = (localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) as ThemeMode;
        applyTheme(savedTheme);
        set(savedTheme);
      }
    }
  };
}

export const theme = createThemeStore();
