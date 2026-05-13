<script lang="ts">
  import { statsStore } from '$lib/stores/stats';
  import { t, lang } from '$lib/i18n';
  import { X, Trophy, Flame, Target, PieChart, Activity, TrendingUp, Share2 } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { fade, fly } from 'svelte/transition';
  import Button from '$lib/components/ui/Button.svelte';

  import { portal } from '$lib/actions/portal';

  interface Props { close: () => void }
  let { close }: Props = $props();

  let stats = $derived($statsStore);
  let canShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);

  async function shareProgress() {
    const text = `Aujourd'hui sur Progredi, j'ai un taux de réussite de ${Math.round(stats.avgSuccess)}% ! J'ai déjà validé ${stats.totalCompleted} objectifs au total. 🚀`;
    try {
      await navigator.share({
        title: 'Ma progression sur Progredi',
        text: text,
        url: window.location.href
      });
    } catch (err) {
      console.log('Erreur partage:', err);
    }
  }

  // Calcul pour le graphique en anneau
  let totalCatCount = $derived(stats.categoryStats.reduce((acc, c) => acc + c.count, 0));
  
  function getDonutSegment(count: number, currentCumulative: number) {
    const percent = (count / totalCatCount) * 100;
    return { start: currentCumulative, end: currentCumulative + percent, percent };
  }

  function getDayName(dateStr: string) {
    return new Date(dateStr).toLocaleDateString($lang, { weekday: 'short' });
  }

  // Pour gérer le cumulatif sans variable globale réactive complexe dans le template
  function getSegments(categoryStats: any[]) {
    let cumulative = 0;
    return categoryStats.map(cat => {
      const seg = getDonutSegment(cat.count, cumulative);
      cumulative = seg.end;
      return { ...cat, ...seg };
    });
  }

  let donutSegments = $derived(getSegments(stats.categoryStats));
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
      <div class="header-title">
        <Activity size={24} color="var(--accent-primary)" />
        <h2>Statistiques</h2>
      </div>
      <div class="header-actions">
        {#if canShare}
          <button class="action-btn" onclick={shareProgress} title="Partager mes stats"><Share2 size={20} /></button>
        {/if}
        <button class="close-btn" onclick={close}><X size={24} /></button>
      </div>
    </header>

    <div class="stats-body">
      <!-- Top Cards -->
      <div class="top-cards">
        <Card>
          <div class="stat-card">
            <TrendingUp size={20} color="var(--success)" />
            <span class="value">{Math.round(stats.avgSuccess)}%</span>
            <span class="label">Réussite (7j)</span>
          </div>
        </Card>
        <Card>
          <div class="stat-card">
            <Trophy size={20} color="var(--warning)" />
            <span class="value">{stats.totalCompleted}</span>
            <span class="label">Total validés</span>
          </div>
        </Card>
        <Card>
          <div class="stat-card">
            <Flame size={20} color="var(--danger)" />
            <span class="value">{stats.streaks[0]?.count || 0}j</span>
            <span class="label">Meilleure série</span>
          </div>
        </Card>
      </div>

      <!-- Weekly Activity Chart -->
      <section class="section">
        <div class="section-header">
          <Activity size={18} />
          <h3>Activité Hebdomadaire</h3>
        </div>
        <Card>
          <div class="chart-container">
            <div class="bar-chart">
              {#each stats.weeklyActivity as day}
                <div class="bar-wrapper">
                  <div class="bar-value" style="height: {day.percentage}%">
                    <span class="hover-info">{Math.round(day.percentage)}%</span>
                  </div>
                  <span class="bar-label">{getDayName(day.date)}</span>
                </div>
              {/each}
            </div>
          </div>
        </Card>
      </section>

      <!-- Category & Streaks Grid -->
      <div class="stats-grid">
        <section class="section">
          <div class="section-header">
            <PieChart size={18} />
            <h3>Par Catégorie</h3>
          </div>
          <Card>
            <div class="donut-section">
              <svg viewBox="0 0 100 100" class="donut">
                {#each donutSegments as seg}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke={seg.color}
                    stroke-width="12"
                    stroke-dasharray="{seg.percent * 2.51} 251"
                    stroke-dashoffset="-{(seg.start / 100) * 251}"
                  />
                {/each}
                <circle cx="50" cy="50" r="30" fill="var(--bg-secondary)" />
              </svg>
              <div class="legend">
                {#each stats.categoryStats.slice(0, 4) as cat}
                  <div class="legend-item">
                    <span class="dot" style="background: {cat.color}"></span>
                    <span class="name">{cat.name}</span>
                    <span class="count">{cat.count}</span>
                  </div>
                {/each}
              </div>
            </div>
          </Card>
        </section>

        <section class="section">
          <div class="section-header">
            <Flame size={18} />
            <h3>Meilleures Séries</h3>
          </div>
          <div class="streaks-list">
            {#each stats.streaks as streak}
              <Card padding="0.75rem">
                <div class="streak-item">
                  <div class="streak-info">
                    <span class="streak-title">{streak.title}</span>
                    <span class="streak-days">{streak.count} jours consécutifs</span>
                  </div>
                  <div class="streak-flame" class:hot={streak.count > 5}>
                    <Flame size={16} fill="currentColor" />
                  </div>
                </div>
              </Card>
            {:else}
              <p class="empty-msg">Validez des objectifs plusieurs jours de suite pour créer des séries !</p>
            {/each}
          </div>
        </section>
      </div>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(12px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    overflow-y: auto;
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: 700px;
    height: fit-content;
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 10;
    border-radius: 1.25rem 1.25rem 0 0;
  }

  .header-title { display: flex; align-items: center; gap: 0.75rem; }
  h2 { font-size: 1.25rem; margin: 0; color: var(--text-primary); }

  .close-btn, .action-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn { color: var(--accent-primary); }
  .action-btn:hover { background: var(--accent-primary); color: white; }

  .stats-body {
    background: var(--bg-primary);
    padding: 1.5rem;
    border-radius: 0 0 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .top-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    padding: 0.5rem 0;
  }

  .stat-card .value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
  .stat-card .label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }

  .section { display: flex; flex-direction: column; gap: 1rem; }
  .section-header { display: flex; align-items: center; gap: 0.5rem; color: var(--accent-primary); }
  .section-header h3 { font-size: 1rem; margin: 0; color: var(--text-primary); }

  .chart-container { height: 200px; display: flex; align-items: flex-end; padding: 1rem 0; }
  .bar-chart { display: flex; justify-content: space-around; align-items: flex-end; width: 100%; height: 100%; gap: 0.5rem; }
  .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
  .bar-value {
    width: 100%;
    max-width: 40px;
    background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 6px 6px 0 0;
    position: relative;
    transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bar-value:hover .hover-info { opacity: 1; transform: translate(-50%, -120%); }
  .hover-info {
    position: absolute; top: 0; left: 50%; transform: translate(-50%, -100%);
    background: var(--text-primary); color: var(--bg-primary); padding: 0.25rem 0.5rem;
    border-radius: 4px; font-size: 0.75rem; opacity: 0; transition: all 0.2s; pointer-events: none;
  }
  .bar-label { margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; }

  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .donut-section { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 1rem 0; }
  .donut { width: 120px; height: 120px; transform: rotate(-90deg); }
  .legend { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; }
  .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .legend-item .name { flex: 1; color: var(--text-secondary); }
  .legend-item .count { font-weight: 700; color: var(--text-primary); }

  .streaks-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .streak-item { display: flex; justify-content: space-between; align-items: center; }
  .streak-info { display: flex; flex-direction: column; }
  .streak-title { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
  .streak-days { font-size: 0.75rem; color: var(--text-secondary); }
  .streak-flame { color: var(--text-secondary); }
  .streak-flame.hot { color: var(--danger); animation: flicker 1s infinite alternate; }
  
  @keyframes flicker { from { opacity: 0.8; transform: scale(1); } to { opacity: 1; transform: scale(1.2); } }
  .empty-msg { font-size: 0.85rem; color: var(--text-secondary); text-align: center; font-style: italic; margin-top: 2rem; }

  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
    .top-cards { grid-template-columns: 1fr; }
  }
</style>
