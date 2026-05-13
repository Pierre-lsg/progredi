import { writable, get } from 'svelte/store';
import { objectives } from './objectives';
import { logs } from './logs';

export const notificationSettings = writable({
  enabled: false,
  eveningSummary: true,
  summaryTime: '20:00',
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'default'
});

// Initialisation depuis le localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('notificationSettings');
  if (saved) notificationSettings.set(JSON.parse(saved));
  
  notificationSettings.subscribe(val => {
    localStorage.setItem('notificationSettings', JSON.stringify(val));
  });
}

export const notifications = {
  async requestPermission() {
    if (typeof Notification === 'undefined') return false;
    const permission = await Notification.requestPermission();
    notificationSettings.update(s => ({ ...s, permission }));
    return permission === 'granted';
  },

  send(title: string, body: string) {
    if (get(notificationSettings).permission !== 'granted') return;
    
    // Essayer via le Service Worker d'abord (mieux pour PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: '/progredi/icons/icon-192x192.png',
          badge: '/progredi/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: 'progredi-reminder'
        } as any);
      });
    } else {
      new Notification(title, { body });
    }
  },

  checkReminders() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const todayStr = now.toISOString().split('T')[0];
    
    const $objectives = get(objectives);
    const $logs = get(logs);
    const settings = get(notificationSettings);

    // 1. Rappels individuels
    $objectives.forEach(obj => {
      if (obj.reminderTime === currentTime && !obj.deletedAt) {
        // Vérifier si déjà fait aujourd'hui
        const isDone = $logs.some(l => l.objectiveId === obj.id && l.date === todayStr && l.status === 'completed');
        if (!isDone) {
          this.send('Rappel Progredi', `N'oubliez pas : ${obj.title}`);
        }
      }
    });

    // 2. Bilan du soir
    if (settings.eveningSummary && settings.summaryTime === currentTime) {
      const pending = $objectives.filter(obj => {
        // Logique de visibilité simplifiée
        const isVisible = obj.frequency === 'daily' || (obj.frequency === 'weekly' && obj.daysOfWeek?.includes(now.getDay()));
        const isDone = $logs.some(l => l.objectiveId === obj.id && l.date === todayStr && l.status === 'completed');
        return isVisible && !isDone && !obj.deletedAt;
      });

      if (pending.length > 0) {
        this.send('Bilan du soir', `Il vous reste ${pending.length} objectifs à compléter pour aujourd'hui ! 💪`);
      }
    }
  }
};

// Lancer la vérification toutes les minutes si l'onglet est ouvert
if (typeof window !== 'undefined') {
  setInterval(() => {
    notifications.checkReminders();
  }, 60000);
}
