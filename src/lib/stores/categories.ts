import { writable } from 'svelte/store';

function createCategoriesStore() {
  const isBrowser = typeof window !== 'undefined';
  const initial: string[] = isBrowser 
    ? JSON.parse(localStorage.getItem('custom_categories') || '[]')
    : [];

  const { subscribe, update } = writable<string[]>(initial);

  return {
    subscribe,
    add: (category: string) => update(cats => {
      if (cats.includes(category)) return cats;
      const newCats = [...cats, category];
      if (isBrowser) localStorage.setItem('custom_categories', JSON.stringify(newCats));
      return newCats;
    }),
    remove: (category: string) => update(cats => {
      const newCats = cats.filter(c => c !== category);
      if (isBrowser) localStorage.setItem('custom_categories', JSON.stringify(newCats));
      return newCats;
    })
  };
}

export const customCategories = createCategoriesStore();

export const defaultCategories = ['Health', 'Leisure', 'Home', 'Work', 'Social', 'General', 'Learning'];
