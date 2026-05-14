<script lang="ts">
  import { onMount } from "svelte";
  import {
    Sun,
    Moon,
    CalendarDays,
    Settings as SettingsIcon,
    Zap,
    Scroll,
    Waves,
    BarChart2,
  } from "lucide-svelte";
  import { theme } from "$lib/stores/theme";
  import { t } from "$lib/i18n";
  import Dashboard from "$lib/components/features/Dashboard.svelte";
  import Settings from "$lib/components/features/Settings.svelte";
  import Stats from "$lib/components/features/Stats.svelte";
  import ReloadPrompt from "$lib/components/features/ReloadPrompt.svelte";

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
    ocean: Waves,
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
          <p>{$t.subtitle}</p>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button
        class="icon-btn"
        onclick={() => (showStats = true)}
        aria-label={$t.stats}
        title={$t.stats}
      >
        <BarChart2 size={20} />
      </button>
      <button
        class="icon-btn"
        onclick={() => (showSettings = true)}
        aria-label={$t.settings}
      >
        <SettingsIcon size={20} />
      </button>
      <button
        class="icon-btn"
        onclick={theme.toggle}
        aria-label={$t.changeTheme}
        title="{$t.theme} : {$theme}"
      >
        <ThemeIcon size={20} />
      </button>
    </div>
  </header>

  <div class="container">
    <Dashboard />
  </div>

  {#if showSettings}
    <Settings close={() => (showSettings = false)} />
  {/if}

  {#if showStats}
    <Stats close={() => (showStats = false)} />
  {/if}

  <ReloadPrompt />
</main>

<style>
  .app-container {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s ease;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border-color);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  h1 {
    font-size: 1.5rem;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--accent-primary),
      var(--accent-secondary)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .logo-text p {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
  }
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  @media (max-width: 600px) {
    header {
      padding: 1rem;
    }
    h1 {
      font-size: 1.25rem;
    }
    .logo-text p {
      display: none;
    }
  }
</style>
