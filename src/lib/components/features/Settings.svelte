<script lang="ts">
  import { X, Moon, Sun, Monitor, Download, Upload, Trash2, Bell, BellOff, Clock } from 'lucide-svelte';
  import { theme } from '$lib/stores/theme';
  import { objectives } from '$lib/stores/objectives';
  import { logs } from '$lib/stores/logs';
  import { t } from '$lib/i18n';
  import { notificationSettings, notifications } from '$lib/stores/notifications';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { fade, fly } from 'svelte/transition';
  import { portal } from '$lib/actions/portal';

  interface Props { close: () => void }
  let { close }: Props = $props();

  function exportData() {
    const data = {
      objectives: JSON.parse(localStorage.getItem('objectives') || '[]'),
      logs: JSON.parse(localStorage.getItem('logs') || '[]'),
      categories: JSON.parse(localStorage.getItem('customCategories') || '[]'),
      theme: localStorage.getItem('theme'),
      lang: localStorage.getItem('lang')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progredi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  function importData(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.objectives) localStorage.setItem('objectives', JSON.stringify(data.objectives));
        if (data.logs) localStorage.setItem('logs', JSON.stringify(data.logs));
        if (data.categories) localStorage.setItem('customCategories', JSON.stringify(data.categories));
        alert('Données importées avec succès ! Rechargez la page.');
        window.location.reload();
      } catch (err) {
        alert('Erreur lors de l\'importation du fichier.');
      }
    };
    reader.readAsText(file);
  }

  async function toggleNotifications() {
    if ($notificationSettings.permission !== 'granted') {
      const granted = await notifications.requestPermission();
      if (!granted) {
        alert('Veuillez autoriser les notifications dans les paramètres de votre navigateur.');
        return;
      }
    }
    notificationSettings.update(s => ({ ...s, enabled: !s.enabled }));
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
  class="modal-overlay" 
  use:portal
  onclick={(e) => { if (e.target === e.currentTarget) close(); }} 
  onkeydown={(e) => { if (e.key === 'Escape') close(); }}
  transition:fade={{ duration: 200 }} 
  role="button" 
  tabindex="-1"
>
  <div class="modal-content" in:fly={{ y: 20, duration: 300 }}>
    <header class="glass">
      <h2>{$t.settings}</h2>
      <button class="close-btn" onclick={close}><X size={24} /></button>
    </header>

    <div class="settings-body">
      <!-- Section Notifications -->
      <section class="section">
        <h3><Bell size={18} /> Notifications</h3>
        <Card>
          <div class="setting-item">
            <div class="setting-info">
              <span class="label">Activer les rappels</span>
              <span class="desc">Recevoir des notifications pour vos objectifs</span>
            </div>
            <button class="toggle" class:active={$notificationSettings.enabled && $notificationSettings.permission === 'granted'} onclick={toggleNotifications}>
              {#if $notificationSettings.permission === 'granted'}
                {#if $notificationSettings.enabled}<Bell size={18} />{:else}<BellOff size={18} />{/if}
              {:else}
                Autoriser
              {/if}
            </button>
          </div>

          {#if $notificationSettings.enabled && $notificationSettings.permission === 'granted'}
            <div class="setting-item border-top">
              <div class="setting-info">
                <span class="label">Bilan du soir</span>
                <span class="desc">Récapitulatif des tâches restantes</span>
              </div>
              <input type="checkbox" bind:checked={$notificationSettings.eveningSummary} />
            </div>
            
            {#if $notificationSettings.eveningSummary}
              <div class="setting-item border-top">
                <div class="setting-info">
                  <span class="label">Heure du bilan</span>
                </div>
                <div class="time-input-wrapper">
                  <Clock size={16} />
                  <input type="time" bind:value={$notificationSettings.summaryTime} class="small-time" />
                </div>
              </div>
            {/if}
          {/if}
        </Card>
      </section>

      <!-- Section Thème -->
      <section class="section">
        <h3><Sun size={18} /> {$t.theme}</h3>
        <div class="theme-grid">
          <button class="theme-btn" class:active={$theme === 'light'} onclick={() => theme.set('light')}>Clair</button>
          <button class="theme-btn" class:active={$theme === 'dark'} onclick={() => theme.set('dark')}>Sombre</button>
          <button class="theme-btn cyber" class:active={$theme === 'cyber'} onclick={() => theme.set('cyber')}>Cyber</button>
          <button class="theme-btn paper" class:active={$theme === 'paper'} onclick={() => theme.set('paper')}>Paper</button>
          <button class="theme-btn ocean" class:active={$theme === 'ocean'} onclick={() => theme.set('ocean')}>Ocean</button>
        </div>
      </section>

      <!-- Section Données -->
      <section class="section">
        <h3><Download size={18} /> {$t.data}</h3>
        <div class="data-actions">
          <Button onclick={exportData}><Download size={18} /> {$t.exportData}</Button>
          <label class="btn-secondary">
            <Upload size={18} /> {$t.importData}
            <input type="file" accept=".json" onchange={importData} hidden />
          </label>
        </div>
        <button class="danger-btn" onclick={() => { if(confirm('Tout supprimer ?')) { localStorage.clear(); window.location.reload(); } }}>
          <Trash2 size={18} /> {$t.clearAll}
        </button>
      </section>
    </div>
  </div>
</div>

<style>
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; justify-content: center; overflow-y: auto; padding: 1rem; }
  .modal-content { width: 100%; max-width: 500px; height: fit-content; margin-top: 2rem; margin-bottom: 2rem; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; position: sticky; top: 0; z-index: 10; border-radius: 1.25rem 1.25rem 0 0; }
  .close-btn { background: none; border: none; color: var(--text-primary); }
  .settings-body { background: var(--bg-primary); padding: 1.5rem; border-radius: 0 0 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 2rem; }
  .section h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; }
  .setting-info { display: flex; flex-direction: column; gap: 0.2rem; }
  .label { font-weight: 600; color: var(--text-primary); }
  .desc { font-size: 0.75rem; color: var(--text-secondary); }
  .border-top { border-top: 1px solid var(--border-color); margin-top: 0.5rem; padding-top: 1rem; }
  .toggle { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.85rem; transition: all 0.2s; }
  .toggle.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
  .time-input-wrapper { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-color); }
  .small-time { background: none; border: none; color: var(--text-primary); font-family: inherit; font-size: 0.9rem; outline: none; }
  .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; }
  .theme-btn { padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-weight: 600; transition: all 0.2s; }
  .theme-btn.active { border-color: var(--accent-primary); background: var(--accent-primary); color: white; }
  .data-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .btn-secondary { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.6rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; }
  .danger-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--danger); background: transparent; color: var(--danger); font-weight: 600; margin-top: 1rem; }
</style>
