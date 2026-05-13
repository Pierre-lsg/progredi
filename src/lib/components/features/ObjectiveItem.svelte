<script lang="ts">
  import { Check, Trash2, Save, X as CloseIcon, Archive, FastForward, Calendar, Flag, GripVertical, Bell } from 'lucide-svelte';
  import { logs } from '$lib/stores/logs';
  import { objectives, type Objective, type Priority } from '$lib/stores/objectives';
  import { defaultCategories, customCategories } from '$lib/stores/categories';
  import { t, lang } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

  interface Props { objective: Objective; date?: Date }
  let { objective, date = new Date() }: Props = $props();

  let isEditing = $state(false);
  let showConfirm = $state(false);
  let editState = $state<Objective>({} as Objective);

  // Synchroniser l'état d'édition avec la prop
  $effect(() => {
    if (!isEditing) {
      editState = { ...objective };
    }
  });

  let dateStr = $derived(date.toISOString().split('T')[0]);
  let log = $derived($logs.find(l => l.objectiveId === objective.id && l.date === dateStr));
  let isCompleted = $derived(log?.status === 'completed');
  let isSkipped = $derived(log?.status === 'skipped');
  let isDeleted = $derived(!!objective.deletedAt);
  let allCategories = $derived([...defaultCategories, ...$customCategories]);
  let currentPriority = $derived(objective.priority || 'low');

  const frequencies: Objective['frequency'][] = ['daily', 'weekly', 'monthly', 'yearly', 'once'];
  const priorities: { id: Priority, label: string, color: string }[] = [
    { id: 'low', label: 'Basse', color: 'var(--success)' },
    { id: 'medium', label: 'Moyenne', color: 'var(--warning)' },
    { id: 'high', label: 'Élevée', color: 'var(--danger)' }
  ];
  const daysOfWeek = [
    { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mer' },
    { id: 4, label: 'Jeu' }, { id: 5, label: 'Ven' }, { id: 6, label: 'Sam' }, { id: 0, label: 'Dim' }
  ];

  function toggleEditDay(id: number) {
    const days = editState.daysOfWeek || [];
    if (days.includes(id)) {
      editState.daysOfWeek = days.filter(d => d !== id);
    } else {
      editState.daysOfWeek = [...days, id];
    }
  }

  function playSuccessSound() {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.1);
  }

  function toggleComplete(e: Event) {
    e.stopPropagation(); if (isDeleted || isEditing) return;
    const newStatus = isCompleted ? null : 'completed';
    logs.setStatus(objective.id, date, newStatus);
    if (newStatus === 'completed') { if ('vibrate' in navigator) navigator.vibrate(50); playSuccessSound(); }
  }

  function toggleSkip(e: Event) {
    e.stopPropagation(); if (isDeleted || isEditing) return;
    logs.setStatus(objective.id, date, isSkipped ? null : 'skipped');
  }

  function toggleFavorite(e: Event) {
    e.stopPropagation(); if (isDeleted || isEditing) return;
    objectives.toggleFavorite(objective.id);
  }

  function saveEdit() {
    if (editState.title.trim()) { 
      objectives.update(objective.id, { ...editState, title: editState.title.trim() }); 
      isEditing = false;
      showConfirm = false;
    }
  }

  function getFrequencyLabel(o: Objective) {
    let base = '';
    if (o.frequency === 'daily') base = $t.daily;
    else if (o.frequency === 'weekly') {
      if (!o.daysOfWeek || o.daysOfWeek.length === 0) base = $t.weekly;
      else if (o.daysOfWeek.length === 7) base = $t.daily;
      else {
        const labels = o.daysOfWeek.map(d => daysOfWeek.find(dw => dw.id === d)?.label).join(', ');
        base = `${$t.weekly} (${labels})`;
      }
    }
    else if (o.frequency === 'monthly') base = `${$t.monthly} (${o.dayOfMonth})`;
    else if (o.frequency === 'yearly') {
      const month = new Date(2024, o.monthOfYear ?? 0, 1).toLocaleDateString($lang, {month: 'short'});
      base = `${$t.yearly} (${o.dayOfMonth} ${month})`;
    }
    else if (o.frequency === 'once') base = `Ponctuel (${o.date})`;
    
    if (o.reminderTime) return `${base} • 🔔 ${o.reminderTime}`;
    return base;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isEditing && !isDeleted && (e.key === 'Enter' || e.key === ' ')) {
      isEditing = true;
      editState = { ...objective };
      return;
    }
    
    if (isEditing) {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') isEditing = false;
    }
  }

  function focus(node: HTMLInputElement) { node.focus(); }

  function clickOutside(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
      if (isEditing && !showConfirm && node && !node.contains(event.target as Node)) {
        const hasChanged = JSON.stringify(editState) !== JSON.stringify(objective);
        if (hasChanged) {
          showConfirm = true;
        } else {
          isEditing = false;
        }
      }
    };
    document.addEventListener('mousedown', handleClick, true);
    return { destroy() { document.removeEventListener('mousedown', handleClick, true); } };
  }
</script>

<Card padding="0.5rem 0.75rem">
  <div 
    class="item" 
    class:completed={isCompleted} 
    class:skipped={isSkipped} 
    class:deleted={isDeleted} 
    class:editing={isEditing}
    onclick={(!isEditing && !isDeleted) ? () => { isEditing = true; editState = { ...objective }; } : null}
    onkeydown={handleKeyDown}
    role="button"
    tabindex={(!isEditing && !isDeleted) ? 0 : -1}
    aria-label="Editer l'objectif"
    style="border-left: 4px solid {priorities.find(p => p.id === currentPriority)?.color}"
  >
    {#if !isDeleted && !isEditing}
      <div class="grip" title="Glisser pour réorganiser"><GripVertical size={14}/></div>
    {/if}

    <button class="check-btn" onclick={toggleComplete} aria-label={$t.completed} disabled={isDeleted || isEditing} tabindex="-1">
      <div class="check-circle">{#if isCompleted}<Check size={18} strokeWidth={3} />{/if}</div>
    </button>
    
    <div class="content" role="none">
      {#if isEditing}
        <div class="edit-panel" onclick={(e) => e.stopPropagation()} use:clickOutside role="none">
          <input type="text" bind:value={editState.title} class="edit-input" use:focus onkeydown={handleKeyDown} />
          
          <div class="edit-row" role="none">
            <select bind:value={editState.priority} class="small-select priority-select" style="color: {priorities.find(p => p.id === (editState.priority || 'low'))?.color}">
              {#each priorities as p}<option value={p.id}>{p.label}</option>{/each}
            </select>
            <select bind:value={editState.category} class="small-select">{#each allCategories as cat}<option value={cat}>{defaultCategories.includes(cat) ? ($t.categories as any)[cat] : cat}</option>{/each}</select>
            <select bind:value={editState.frequency} class="small-select">{#each frequencies as f}<option value={f}>{f === 'once' ? 'Ponctuel' : $t[f]}</option>{/each}</select>
          </div>

          <div class="edit-row" role="none">
            <div class="time-picker-custom" role="none">
              <Bell size={14}/>
              <input type="time" bind:value={editState.reminderTime} class="small-input-time" />
              <span>{editState.reminderTime || 'Pas de rappel'}</span>
            </div>
            {#if editState.frequency === 'once'}
              <div class="date-picker-custom small" role="none"><Calendar size={14}/><input type="date" bind:value={editState.date} class="input-sub-date" /><span>{editState.date}</span></div>
            {/if}
          </div>

          {#if editState.frequency === 'weekly'}
            <div class="edit-row small" role="none">{#each daysOfWeek as day}<button class="chip" class:active={editState.daysOfWeek?.includes(day.id)} onclick={() => toggleEditDay(day.id)}>{day.label}</button>{/each}</div>
          {:else if editState.frequency === 'monthly' || editState.frequency === 'yearly'}
            <div class="edit-row" role="none"><input type="number" min="1" max="31" bind:value={editState.dayOfMonth} class="small-input" />
              {#if editState.frequency === 'yearly'}<select bind:value={editState.monthOfYear} class="small-select">{#each Array.from({length: 12}, (_, i) => i) as m}<option value={m}>{new Date(2024, m, 1).toLocaleDateString($lang, {month: 'short'})}</option>{/each}</select>{/if}</div>
          {/if}
        </div>
      {:else}
        <div class="header" role="none">
          <span class="category">{defaultCategories.includes(objective.category) ? ($t.categories as any)[objective.category] : objective.category}</span>
          <span class="frequency">{getFrequencyLabel(objective)}</span>
          {#if isDeleted}<span class="archived-badge"><Archive size={12}/> Archivé</span>{/if}
          {#if isSkipped}<span class="skipped-badge">Écarté</span>{/if}
        </div>
        <h3 class="title">{objective.title}</h3>
      {/if}
    </div>

    {#if !isEditing && !isDeleted}
      <div class="actions-right" role="none">
        <button class="favorite-btn" class:active={objective.isFavorite} onclick={toggleFavorite} title="Favori">
          <Flag size={18} fill={objective.isFavorite ? 'var(--danger)' : 'none'} stroke={objective.isFavorite ? 'var(--danger)' : 'currentColor'} />
        </button>
        <button class="skip-btn" class:active={isSkipped} onclick={toggleSkip} title="Écarter" tabindex="-1"><FastForward size={18} /></button>
        <button class="delete-btn" onclick={(e) => { e.stopPropagation(); if (confirm('Voulez-vous supprimer cet objectif ?')) objectives.remove(objective.id); }} tabindex="-1"><Trash2 size={18} /></button>
      </div>
    {/if}
  </div>
</Card>

{#if showConfirm}
  <ConfirmModal 
    onConfirm={saveEdit} 
    onCancel={() => { isEditing = false; showConfirm = false; }} 
  />
{/if}

<style>
  .item { display: flex; align-items: center; gap: 0.75rem; width: 100%; cursor: pointer; transition: all 0.2s; border-radius: 0.5rem; border-left: 4px solid transparent; position: relative; }
  .item:focus-visible { box-shadow: 0 0 0 2px var(--accent-primary); }
  .item.deleted { cursor: default; opacity: 0.8; }
  .item.skipped, .item.completed { opacity: 0.6; }
  .item.editing { cursor: default; }
  .grip { color: var(--text-secondary); opacity: 0.2; cursor: grab; flex-shrink: 0; }
  .item:hover .grip { opacity: 0.6; }
  .check-btn { background: none; border: none; padding: 0; z-index: 2; flex-shrink: 0; }
  .check-btn:disabled { opacity: 0.5; cursor: default; }
  .check-circle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--accent-primary); display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s ease; }
  .completed .check-circle { background: var(--success); border-color: var(--success); }
  .content { flex: 1; min-width: 0; padding: 0.25rem 0; }
  .header { display: flex; gap: 0.4rem; margin-bottom: 0.15rem; flex-wrap: wrap; align-items: center; }
  .category { font-size: 0.6rem; text-transform: uppercase; font-weight: 700; color: var(--accent-primary); background: rgba(var(--bg-secondary-rgb), 0.5); border: 1px solid var(--accent-primary); padding: 0.05rem 0.3rem; border-radius: 4px; }
  .frequency { font-size: 0.65rem; color: var(--text-secondary); }
  .archived-badge, .skipped-badge { font-size: 0.6rem; padding: 0.05rem 0.3rem; border-radius: 4px; display: flex; align-items: center; gap: 0.2rem; }
  .archived-badge { color: var(--text-secondary); background: var(--bg-secondary); }
  .skipped-badge { color: white; background: var(--text-secondary); }
  .title { font-size: 0.95rem; color: var(--text-primary); transition: color 0.2s ease; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
  .completed .title { color: var(--text-secondary); text-decoration: line-through; font-style: italic; }
  .skipped .title { color: var(--text-secondary); font-style: italic; }
  .edit-panel { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; background: var(--bg-primary); padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--accent-primary); z-index: 100; }
  .edit-input { background: none; border: none; border-bottom: 1px solid var(--border-color); color: var(--text-primary); padding: 0.25rem; font-size: 1rem; width: 100%; outline: none; }
  .edit-row { display: flex; gap: 0.25rem; flex-wrap: wrap; }
  .small-select, .small-input { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.8rem; padding: 0.2rem; border-radius: 0.3rem; outline: none; }
  .priority-select { font-weight: 700; }
  .time-picker-custom { position: relative; display: flex; align-items: center; gap: 0.4rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.3rem; padding: 0.2rem 0.5rem; color: var(--accent-primary); font-size: 0.8rem; }
  .small-input-time { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .chip { background: var(--bg-secondary); border: 1px solid var(--border-color); font-size: 0.7rem; padding: 0.2rem 0.4rem; border-radius: 1rem; color: var(--text-secondary); }
  .chip.active { background: var(--accent-primary); color: white; }
  .date-picker-custom { position: relative; display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.3rem; padding: 0.2rem 0.5rem; color: var(--accent-primary); font-size: 0.8rem; }
  .input-sub-date { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .actions-right { display: flex; gap: 0.1rem; opacity: 0; transition: opacity 0.2s; flex-shrink: 0; }
  .item:hover .actions-right { opacity: 1; }
  .favorite-btn, .skip-btn, .delete-btn { background: none; border: none; color: var(--text-secondary); padding: 0.4rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; transition: all 0.2s; }
  .favorite-btn.active { color: var(--danger); opacity: 1; }
  .skip-btn.active { color: var(--accent-primary); background: rgba(var(--accent-primary-rgb), 0.1); }
  @media (max-width: 600px) { .actions-right { opacity: 1; } }
</style>
