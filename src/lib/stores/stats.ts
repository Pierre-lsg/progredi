import { derived } from 'svelte/store';
import { objectives, type Objective } from './objectives';
import { logs, type Log } from './logs';

export interface DailyStat {
  date: string;
  percentage: number;
  total: number;
  done: number;
}

export interface CategoryStat {
  name: string;
  count: number;
  color: string;
}

export interface StreakStat {
  title: string;
  count: number;
}

export const statsStore = derived([objectives, logs], ([$objectives, $logs]) => {
  const getDailyPercentage = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const visibleOnDate = $objectives.filter(o => {
      // Logique simplifiée pour les stats historiques
      if (o.deletedAt && new Date(o.deletedAt) < date) return false;
      if (o.frequency === 'daily') return true;
      if (o.frequency === 'weekly') return o.daysOfWeek?.includes(date.getDay());
      if (o.frequency === 'once') return o.date === dateStr;
      return false;
    });

    if (visibleOnDate.length === 0) return { percentage: 0, total: 0, done: 0 };
    
    const done = $logs.filter(l => 
      l.date === dateStr && 
      l.status === 'completed' && 
      visibleOnDate.some(o => o.id === l.objectiveId)
    ).length;

    return {
      percentage: (done / visibleOnDate.length) * 100,
      total: visibleOnDate.length,
      done
    };
  };

  // 1. Données des 7 derniers jours
  const weeklyActivity: DailyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const data = getDailyPercentage(d);
    weeklyActivity.push({
      date: d.toISOString().split('T')[0],
      ...data
    });
  }

  // 2. Stats par catégorie
  const catMap = new Map<string, number>();
  $logs.filter(l => l.status === 'completed').forEach(l => {
    const obj = $objectives.find(o => o.id === l.objectiveId);
    if (obj) {
      catMap.set(obj.category, (catMap.get(obj.category) || 0) + 1);
    }
  });
  const categoryStats: CategoryStat[] = Array.from(catMap.entries()).map(([name, count]) => ({
    name,
    count,
    color: `hsl(${Math.random() * 360}, 70%, 60%)` // Couleurs dynamiques
  })).sort((a, b) => b.count - a.count);

  // 3. Calcul des Séries (Streaks)
  const streaks: StreakStat[] = $objectives
    .filter(o => !o.deletedAt)
    .map(o => {
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const log = $logs.find(l => l.objectiveId === o.id && l.date === dStr);
        if (log?.status === 'completed') count++;
        else if (i === 0) continue; // Si pas fini aujourd'hui, on continue de chercher hier
        else break; // Chaîne brisée
      }
      return { title: o.title, count };
    })
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalCompleted = $logs.filter(l => l.status === 'completed').length;
  const avgSuccess = weeklyActivity.reduce((acc, curr) => acc + curr.percentage, 0) / 7;

  return {
    weeklyActivity,
    categoryStats,
    streaks,
    totalCompleted,
    avgSuccess
  };
});
