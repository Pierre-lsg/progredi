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
    { id: "all", label: $t.allFrequencies },
    { id: "daily", label: $t.daily },
    { id: "weekly", label: $t.weekly },
    { id: "monthly", label: $t.monthly },
    { id: "yearly", label: $t.yearly },
    { id: "once", label: $t.once },
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

  function getObjectiveStatus(
    objective: Objective,
    date: Date,
    allLogs: Log[],
  ) {
    const dateStr = date.toISOString().split("T")[0];
    const log = allLogs.find(
      (l) => l.objectiveId === objective.id && l.date === dateStr,
    );
    if (log?.status === "completed") return 2;
    if (log?.status === "skipped") return 1;
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

        if (statusA === 0) {
          // Uniquement pour les actifs
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
    done: visibleOnDate.filter(
      (o) => getObjectiveStatus(o, selectedDate, $logs) === 2,
    ).length,
  });

  let canShare = $derived(
    typeof navigator !== "undefined" && !!navigator.share,
  );

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
    if (sortBy === "manual") return $t.sortManual;
    if (sortBy === "priority") return $t.sortPriority;
    if (sortBy === "category") return $t.sortCategory;
    return "";
  }

  async function shareToday() {
    const text = $t.shareTodayText(dateStr, stats.done, stats.total);
    try {
      await navigator.share({
        title: $t.title,
        text: text,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Erreur partage:", err);
    }
  }

  let dateInput: HTMLInputElement;

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

  // Swipe logic
  let touchStartX = 0;
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }
  function handleTouchEnd(e: TouchEvent) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    const threshold = 50; // pixels requis pour déclencher le swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0)
        changeDate(-1); // Swipe à droite -> jour précédent
      else changeDate(1); // Swipe à gauche -> jour suivant
    }
  }
</script>

<div class="dashboard animate-in">
  <div class="date-nav">
    <button class="icon-btn" onclick={() => changeDate(-1)}>
      <ChevronLeft size={24} />
    </button>
    <div class="date-info">
      <div class="date-header">
        <button class="date-btn" onclick={() => dateInput.showPicker()}>
          {dateStr}
        </button>
        <input
          type="date"
          bind:this={dateInput}
          class="hidden-date-input"
          value={dateValue}
          onchange={handleDateInput}
        />
        {#if canShare}
          <button
            class="share-mini-btn"
            onclick={shareToday}
            title={$t.shareStats}
          >
            <Share2 size={12} />
          </button>
        {/if}
      </div>
      <div
        class="swipe-zone"
        role="button"
        tabindex="-1"
        aria-label="Swipe to change date"
        ontouchstart={handleTouchStart}
        ontouchend={handleTouchEnd}
      >
        <div class="progress-container">
          <p class="progress">{stats.done} / {stats.total} {$t.completed}</p>
        </div>
      </div>
    </div>
    <button class="icon-btn" onclick={() => changeDate(1)}>
      <ChevronRight size={24} />
    </button>
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
          placeholder={$t.searchPlaceholder}
          class="input-sub search-input"
        />
      </div>
      <div class="filter-actions">
        <button
          class="icon-btn {sortBy !== 'manual' ? 'active' : ''}"
          onclick={cycleSort}
          title={getSortLabel()}
        >
          {#if sortBy === "priority"}
            <ListOrdered size={20} />
          {:else if sortBy === "category"}
            <AlignLeft size={20} />
          {:else}
            <ArrowUpDown size={20} />
          {/if}
        </button>
        <button
          class="icon-btn {hideCompleted ? 'active' : ''}"
          onclick={() => (hideCompleted = !hideCompleted)}
          title={hideCompleted ? $t.showAll : $t.hideCompleted}
        >
          {#if hideCompleted}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
        </button>
      </div>
    </div>

    <div class="select-row">
      <div class="select-wrapper">
        <Filter size={14} class="select-icon" />
        <select bind:value={categoryFilter} class="filter-select">
          <option value="all">{$t.allCategories}</option>
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
            {$t.noResults}
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
    padding-bottom: 2rem;
  }
  .date-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
  }
  .date-header {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 0.5rem;
    position: relative;
  }
  .date-info {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    cursor: pointer;
  }
  .date-btn {
    background: none;
    border: none;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: capitalize;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }
  .date-btn:hover {
    color: var(--accent-primary);
  }
  .hidden-date-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }
  .date-input-hidden {
    display: none;
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
  }
  .swipe-zone {
    width: 100%;
    padding: 0.5rem 0;
    touch-action: pan-y; /* Permet le scroll vertical mais bloque le scroll horizontal par défaut pour notre swipe */
  }
  .btn-icon.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
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
    font-size: 0.9rem;
  }

  .filter-actions {
    display: flex;
    gap: 0.4rem;
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
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1rem;
  }
  .select-wrapper .select-icon {
    position: absolute;
    left: 0.6rem;
    color: var(--text-secondary);
    pointer-events: none;
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
</style>
