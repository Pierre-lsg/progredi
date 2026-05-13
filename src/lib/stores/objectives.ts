import { writable } from 'svelte/store';

export type Priority = 'low' | 'medium' | 'high';

export interface Objective {
  id: string;
  title: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';
  daysOfWeek?: number[]; // Changé de dayOfWeek (nombre) à daysOfWeek (tableau)
  dayOfMonth?: number;
  monthOfYear?: number;
  date?: string;
  reminderTime?: string; // Heure au format "HH:mm"
  isFavorite: boolean;
  priority: Priority;
  createdAt: number;
  deletedAt?: number;
  order: number;
}

function createObjectivesStore() {
  const isBrowser = typeof window !== 'undefined';
  const initialObjectives: Objective[] = isBrowser 
    ? JSON.parse(localStorage.getItem('objectives') || '[]')
    : [];

  // Migration simple pour les anciens objectifs hebdomadaires
  const migrated = initialObjectives.map(o => {
    if (o.frequency === 'weekly' && (o as any).dayOfWeek !== undefined && !o.daysOfWeek) {
      return { ...o, daysOfWeek: [(o as any).dayOfWeek] };
    }
    return o;
  });

  const { subscribe, set, update } = writable<Objective[]>(migrated.sort((a, b) => a.order - b.order));

  const save = (obs: Objective[]) => {
    if (isBrowser) localStorage.setItem('objectives', JSON.stringify(obs));
  };

  return {
    subscribe,
    set: (obs: Objective[]) => { set(obs); save(obs); },
    add: (objective: Omit<Objective, 'id' | 'order' | 'createdAt'>) => update(obs => {
      const maxOrder = obs.length > 0 ? Math.max(...obs.map(o => o.order)) : 0;
      const newObs: Objective[] = [...obs, { 
        ...objective, 
        id: crypto.randomUUID(), 
        createdAt: Date.now(),
        order: maxOrder + 1
      } as Objective];
      save(newObs); return newObs;
    }),
    remove: (id: string) => update(obs => {
      const newObs = obs.map(o => o.id === id ? { ...o, deletedAt: Date.now() } : o);
      save(newObs); return newObs;
    }),
    update: (id: string, updatedFields: Partial<Objective>) => update(obs => {
      const newObs = obs.map(o => o.id === id ? { ...o, ...updatedFields } : o);
      save(newObs); return newObs;
    }),
    toggleFavorite: (id: string) => update(obs => {
      const newObs = obs.map(o => o.id === id ? { ...o, isFavorite: !o.isFavorite } : o);
      save(newObs); return newObs;
    }),
    reorder: (newOrder: Objective[]) => {
      const reordered = newOrder.map((o, i) => ({ ...o, order: i }));
      set(reordered); save(reordered);
    }
  };
}

export const objectives = createObjectivesStore();
