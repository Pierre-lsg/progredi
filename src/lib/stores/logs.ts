import { writable } from 'svelte/store';

export interface Log {
  objectiveId: string;
  date: string; // ISO format (YYYY-MM-DD)
  status: 'completed' | 'skipped';
}

function createLogsStore() {
  const isBrowser = typeof window !== 'undefined';
  const initialLogs: Log[] = isBrowser 
    ? JSON.parse(localStorage.getItem('logs') || '[]')
    : [];

  const { subscribe, update } = writable<Log[]>(initialLogs);

  const save = (logs: Log[]) => {
    if (isBrowser) localStorage.setItem('logs', JSON.stringify(logs));
  };

  return {
    subscribe,
    // On remplace toggle par setStatus pour plus de clarté
    setStatus: (objectiveId: string, date: Date, status: 'completed' | 'skipped' | null) => update(logs => {
      const dateStr = date.toISOString().split('T')[0];
      // On retire l'éventuel log existant pour cette date/objectif
      let newLogs = logs.filter(l => !(l.objectiveId === objectiveId && l.date === dateStr));
      
      // Si on définit un statut (pas null), on l'ajoute
      if (status) {
        newLogs.push({ objectiveId, date: dateStr, status });
      }
      
      save(newLogs);
      return newLogs;
    }),
    // Rétrocompatibilité ou helper rapide
    toggleCompletion: (objectiveId: string, date: Date) => update(logs => {
      const dateStr = date.toISOString().split('T')[0];
      const existing = logs.find(l => l.objectiveId === objectiveId && l.date === dateStr);
      
      let newLogs;
      if (existing && existing.status === 'completed') {
        newLogs = logs.filter(l => !(l.objectiveId === objectiveId && l.date === dateStr));
      } else {
        newLogs = logs.filter(l => !(l.objectiveId === objectiveId && l.date === dateStr));
        newLogs.push({ objectiveId, date: dateStr, status: 'completed' });
      }
      
      save(newLogs);
      return newLogs;
    })
  };
}

export const logs = createLogsStore();
