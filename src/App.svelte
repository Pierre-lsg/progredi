<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon, CalendarDays, Settings as SettingsIcon, Zap, Scroll, Waves, BarChart2 } from 'lucide-svelte';
  import { theme } from '$lib/stores/theme';
  import Dashboard from '$lib/components/features/Dashboard.svelte';
  import Settings from '$lib/components/features/Settings.svelte';
  import Stats from '$lib/components/features/Stats.svelte';
  import ReloadPrompt from '$lib/components/features/ReloadPrompt.svelte';

  let showSettings = $state(false);
  let showStats = $state(false);

  onMount(() => {
    theme.init();
  });

  const themeIcons = {
    light: Sun,
    dark: Moon,
    cyber: Zap,
    paper: Scroll,
    ocean: Waves
  };

  let ThemeIcon = $derived(themeIcons[$theme]);
</script>

<main class="app-container">
  <header class="glass animate-in">
    <div class="header-content">
      <div class="logo">
        <CalendarDays size={32} color="var(--accent-primary)" />
        <div class="logo-text">
          <h1>Progredi</h1>
          <p>Suivi du quotidien</p>
        </div>
      </div>
    </div>
    
    <div class="header-actions">
      <button class="icon-btn" onclick={() => showStats = true} aria-label="Statistiques" title="Statistiques">
        <BarChart2 size={20} />
      </button>

      <button class="icon-btn" onclick={() => showSettings = true} aria-label="Paramètres">
        <SettingsIcon size={20} />
      </button>

      <button class="icon-btn" onclick={theme.toggle} aria-label="Changer de thème" title="Thème : {$theme}">
        <ThemeIcon size={20} />
      </button>
    </div>
  </header>

  <div class="container">
    <Dashboard />
  </div>

  {#if showSettings}
    <Settings close={() => showSettings = false} />
  {/if}

  {#if showStats}
    <Stats close={() => showStats = false} />
  {/if}

  <ReloadPrompt />
</main>

<style>
  .app-container { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); transition: background-color 0.3s ease; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border-color); }
  .logo { display: flex; align-items: center; gap: 1rem; }
  h1 { font-size: 1.5rem; margin: 0; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .logo-text p { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
  .header-actions { display: flex; gap: 0.5rem; }
  .icon-btn { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.6rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .icon-btn:hover { background: var(--accent-primary); color: white; transform: translateY(-2px); border-color: var(--accent-primary); box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.3); }
  .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  @media (max-width: 600px) { header { padding: 1rem; } h1 { font-size: 1.25rem; } .logo-text p { display: none; } }
</style>
