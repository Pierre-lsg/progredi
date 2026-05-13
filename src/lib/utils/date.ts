/**
 * Retourne le premier jour de la semaine (Lundi) pour une date donnée
 */
export function getStartOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustement pour que la semaine commence le lundi
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Retourne toutes les dates d'une semaine au format ISO (YYYY-MM-DD)
 */
export function getWeekDates(date: Date): string[] {
  const start = new Date(getStartOfWeek(date));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

/**
 * Retourne le mois et l'année au format YYYY-MM
 */
export function getMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}
