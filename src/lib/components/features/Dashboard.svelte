<script lang="ts">
  import { objectives, type Objective } from "$lib/stores/objectives";
  import { logs, type Log } from "$lib/stores/logs";
  import { defaultCategories, customCategories } from "$lib/stores/categories";
  import { t, lang } from "$lib/i18n";
  import ObjectiveItem from "$lib/components/features/ObjectiveItem.svelte";
  import AddObjective from "$lib/components/features/AddObjective.svelte";
  import {
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    GripVertical,
    Search,
    Filter,
    ArrowUpDown,
    ListOrdered,
    AlignLeft,
    BarChart2,
    Share2,
  } from "lucide-svelte";

  let selectedDate = $state(new Date());
  let searchQuery = $state("");
  let categoryFilter = $state("all");
  let frequencyFilter = $state("all");
  let hideCompleted = $state(false);
  let sortBy = $state<"manual" | "priority" | "category">("manual");
  let draggingId = $state<string | null>(null);

  let dateStr = $derived(
    selectedDate.toLocaleDateString($lang, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
  let dateValue = $derived(selectedDate.toISOString().split("T")[0]);
  let allCategories = $derived([...defaultCategories, ...$customCategories]);

  const frequencies = [
    { id: "all", label: "Toutes les fréquences" },
    { id: "daily", label: $t.daily },
    { id: "weekly", label: $t.weekly },
    { id: "monthly", label: $t.monthly },
    { id: "yearly", label: $t.yearly },
    { id: "once", label: "Ponctuel" },
  ];

  function changeDate(days: number) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    selectedDate = newDate;
  }

  function handleDateInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value) selectedDate = new Date(target.value);
  }

  function isObjectiveVisible(
    objective: Objective,
    date: Date,
    allLogs: Log[],
  ) {
    const selectedDateStr = date.toISOString().split("T")[0];
    let visible = false;
    if (objective.frequency === "daily") visible = true;
    else if (objective.frequency === "weekly") {
      const today = date.getDay();
      visible = objective.daysOfWeek?.includes(today) ?? false;
    } else if (objective.frequency === "monthly") {
      const targetDay = objective.dayOfMonth || 1;
      const lastDayOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      visible = date.getDate() === Math.min(targetDay, lastDayOfMonth);
    } else if (objective.frequency === "yearly")
      visible =
        date.getMonth() === objective.monthOfYear &&
        date.getDate() === objective.dayOfMonth;
    else if (objective.frequency === "once")
      visible = objective.date === selectedDateStr;
    if (!visible) return false;
    if (objective.deletedAt) {
      const deleteDateStr = new Date(objective.deletedAt)
        .toISOString()
        .split("T")[0];
      if (selectedDateStr >= deleteDateStr)
        return getObjectiveStatus(objective, date, allLogs) === 2;
    }
    return true;
  }

  function getObjectiveStatus(objective: Objective, date: Date, allLogs: Log[]) {
    const dateStr = date.toISOString().split("T")[0];
    const log = allLogs.find(l => l.objectiveId === objective.id && l.date === dateStr);
    if (log?.status === 'completed') return 2;
    if (log?.status === 'skipped') return 1;
    return 0;
  }

  let visibleOnDate = $derived(
    $objectives.filter((o) => isObjectiveVisible(o, selectedDate, $logs)),
  );

  let filteredObjectives = $derived(
    visibleOnDate
      .filter((o) => {
        const matchesSearch = o.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || o.category === categoryFilter;
        const matchesFrequency =
          frequencyFilter === "all" || o.frequency === frequencyFilter;
        const matchesHidden =
          !hideCompleted || getObjectiveStatus(o, selectedDate, $logs) === 0;
        return (
          matchesSearch && matchesCategory && matchesFrequency && matchesHidden
        );
      })
      .sort((a, b) => {
        const statusA = getObjectiveStatus(a, selectedDate, $logs);
        const statusB = getObjectiveStatus(b, selectedDate, $logs);
        
        if (statusA !== statusB) return statusA - statusB;

        if (statusA === 0) { // Uniquement pour les actifs
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        }
        
        if (sortBy === "priority") {
          const pMap = { high: 3, medium: 2, low: 1 };
          const pA = pMap[a.priority || "low"];
          const pB = pMap[b.priority || "low"];
          if (pA !== pB) return pB - pA;
        } else if (sortBy === "category") {
          if (a.category !== b.category)
            return a.category.localeCompare(b.category);
        }
        return a.order - b.order;
      }),
  );

  let stats = $derived({
    total: visibleOnDate.length,
    done: visibleOnDate.filter((o) => getObjectiveStatus(o, selectedDate, $logs) === 2)
      .length,
  });

  let canShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);

  function cycleSort() {
    const modes: ("manual" | "priority" | "category")[] = [
      "manual",
      "priority",
      "category",
    ];
    const current = modes.indexOf(sortBy);
    sortBy = modes[(current + 1) % modes.length];
  }

  function getSortLabel() {
    if (sortBy === "manual") return "Tri Manuel";
    if (sortBy === "priority") return "Tri Priorité";
    if (sortBy === "category") return "Tri Catégorie";
    return "";
  }

  async function shareToday() {
    const text = `Aujourd'hui sur Progredi (${dateStr}), j'ai déjà validé ${stats.done} objectifs sur ${stats.total} ! 🎯`;
    try {
      await navigator.share({
        title: 'Ma journée sur Progredi',
        text: text,
        url: window.location.href
      });
    } catch (err) {
      console.log('Erreur partage:', err);
    }
  }

  function handleDragStart(id: string) {
    draggingId = id;
  }
  function handleDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    const dragIdx = $objectives.findIndex((o) => o.id === draggingId);
    const targetIdx = $objectives.findIndex((o) => o.id === targetId);
    const newObs = [...$objectives];
    const [draggedItem] = newObs.splice(dragIdx, 1);
    newObs.splice(targetIdx, 0, draggedItem);
    objectives.reorder(newObs);
    sortBy = "manual";
  }
</script>

<div class="dashboard animate-in">
  <div class="date-selector">
    <button onclick={() => changeDate(-1)} aria-label="Jour précédent"
      ><ChevronLeft size={24} /></button
    >
    <div class="date-info">
      <div class="date-picker-wrapper">
        <h2 class="date-display">{dateStr}</h2>
        <input
          type="date"
          value={dateValue}
          oninput={handleDateInput}
          class="date-input"
        />
      </div>
      <div class="progress-container">
        <p class="progress">{stats.done} / {stats.total} {$t.completed}</p>
        {#if canShare}
          <button class="share-mini-btn" onclick={shareToday} title="Partager ma journée">
            <Share2 size={12} />
          </button>
        {/if}
      </div>
    </div>
    <button onclick={() => changeDate(1)} aria-label="Jour suivant"
      ><ChevronRight size={24} /></button
    >
  </div>

  <div class="stats-bar">
    <div class="progress-track">
      <div
        class="progress-fill"
        style="width: {stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%"
      ></div>
    </div>
  </div>

  <div class="filters-container glass">
    <div class="search-row">
      <AddObjective compact={true} />
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Rechercher un objectif..."
          class="search-input"
        />
      </div>
      <div class="filter-actions">
        <button
          class="filter-btn"
          class:active={sortBy !== "manual"}
          onclick={cycleSort}
          title={getSortLabel()}
        >
          {#if sortBy === "manual"}<ListOrdered size={18} />
          {:else if sortBy === "priority"}<BarChart2 size={18} />
          {:else}<AlignLeft size={18} />{/if}
        </button>
        <button
          class="toggle-completed"
          class:active={hideCompleted}
          onclick={() => (hideCompleted = !hideCompleted)}
          title={hideCompleted ? "Afficher tout" : "Masquer complétés"}
        >
          {#if hideCompleted}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
        </button>
      </div>
    </div>

    <div class="select-row">
      <div class="select-wrapper">
        <Filter size={14} class="select-icon" />
        <select bind:value={categoryFilter} class="filter-select">
          <option value="all">Toutes les catégories</option>
          {#each allCategories as cat}
            <option value={cat}
              >{defaultCategories.includes(cat)
                ? ($t.categories as any)[cat]
                : cat}</option
            >
          {:else}
            <!-- Empty state -->
          {/each}
        </select>
      </div>

      <div class="select-wrapper">
        <select bind:value={frequencyFilter} class="filter-select">
          {#each frequencies as freq}
            <option value={freq.id}>{freq.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <div class="objective-list">
    {#if filteredObjectives.length === 0}
      <div class="empty">
        <p>{$t.noObjectives}</p>
        <p class="sub">
          {#if searchQuery || categoryFilter !== "all" || frequencyFilter !== "all"}
            Aucun résultat pour ces filtres.
          {:else}
            {hideCompleted && stats.done > 0 ? $t.allDone : $t.startAdding}
          {/if}
        </p>
      </div>
    {:else}
      {#each filteredObjectives as objective (objective.id)}
        <div
          class="draggable-wrapper"
          role="listitem"
          draggable={!objective.deletedAt}
          ondragstart={() => handleDragStart(objective.id)}
          ondragover={(e) => handleDragOver(e, objective.id)}
          ondragend={() => (draggingId = null)}
          class:dragging={draggingId === objective.id}
        >
          <ObjectiveItem {objective} date={selectedDate} />
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .date-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: center;
  }
  .date-selector button {
    background: none;
    border: none;
    color: var(--accent-primary);
    padding: 0.5rem;
  }
  .date-picker-wrapper {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }
  .date-display {
    font-size: 1.25rem;
    text-transform: capitalize;
    color: var(--accent-primary);
  }
  .date-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .progress {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .progress-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .share-mini-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--accent-primary);
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .share-mini-btn:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }
  .stats-bar {
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--accent-primary),
      var(--accent-secondary)
    );
    transition: width 0.4s;
  }

  .filters-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 1rem;
    border: 1px solid var(--border-color);
  }
  .search-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    width: 100%;
  }
  .search-input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-secondary);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0.6rem 0.75rem 0.6rem 2.5rem;
    color: var(--text-primary);
    outline: none;
    font-size: 0.9rem;
  }
  .search-input:focus {
    border-color: var(--accent-primary);
  }

  .filter-actions {
    display: flex;
    gap: 0.4rem;
  }
  .filter-btn,
  .toggle-completed {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.6rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    min-width: 42px;
  }
  .filter-btn.active,
  .toggle-completed.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }

  .select-row {
    display: flex;
    gap: 0.5rem;
  }
  .select-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  .filter-select {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0.5rem 0.5rem 0.5rem 2rem;
    color: var(--text-primary);
    font-size: 0.85rem;
    outline: none;
    appearance: none;
  }
  .select-wrapper:last-child .filter-select {
    padding-left: 0.75rem;
  }

  .objective-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }
  .draggable-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
  .draggable-wrapper :global(.card) {
    flex: 1;
    width: 100%;
  }
  .draggable-wrapper.dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }
  .actions {
    margin-top: 2rem;
  }
</style>
