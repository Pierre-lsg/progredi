<script lang="ts">
  import { X, Moon, Sun, Monitor, Download, Upload, Trash2, Bell, BellOff, Clock, Languages } from 'lucide-svelte';
  import { theme } from '$lib/stores/theme';
  import { objectives } from '$lib/stores/objectives';
  import { logs } from '$lib/stores/logs';
  import { t, lang, type Language } from '$lib/i18n';
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
    <header class="panel-header">
      <h2>{$t.settings}</h2>
      <button class="close-btn" onclick={close}><X size={24} /></button>
    </header>

    <div class="panel-body">
      <!-- Section Notifications -->
      <section class="section">
        <h3><Bell size={18} /> {$t.notifications}</h3>
        <Card>
          <div class="setting-item">
            <div class="setting-info">
              <span class="label">{$t.enableReminders}</span>
              <span class="desc">{$t.remindersDesc}</span>
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
                <span class="label">{$t.eveningSummary}</span>
                <span class="desc">{$t.eveningSummaryDesc}</span>
              </div>
              <input type="checkbox" bind:checked={$notificationSettings.eveningSummary} />
            </div>
            
            {#if $notificationSettings.eveningSummary}
              <div class="setting-item border-top">
                <div class="setting-info">
                  <span class="label">{$t.summaryTime}</span>
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
        <select 
          value={$theme} 
          onchange={(e) => theme.set(e.currentTarget.value as any)}
          class="settings-select"
        >
          <option value="light">☀️ {$t.themes.light}</option>
          <option value="dark">🌙 {$t.themes.dark}</option>
          <option value="cyber">⚡ {$t.themes.cyber}</option>
          <option value="paper">📜 {$t.themes.paper}</option>
          <option value="ocean">🌊 {$t.themes.ocean}</option>
        </select>
      </section>
      
      <!-- Section Langue -->
      <section class="section">
        <h3><Languages size={18} /> {$t.language}</h3>
        <select 
          value={$lang} 
          onchange={(e) => lang.set(e.currentTarget.value as Language)}
          class="settings-select"
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="en">🇬🇧 English</option>
          <option value="es">🇪🇸 Español</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="it">🇮🇹 Italiano</option>
        </select>
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
  .settings-body { display: flex; flex-direction: column; gap: 2rem; }
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
  .data-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .btn-secondary { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.6rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; }
  .danger-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--danger); background: transparent; color: var(--danger); font-weight: 600; margin-top: 1rem; }
</style>
