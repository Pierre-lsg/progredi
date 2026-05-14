<script lang="ts">
  import { Plus, X, Mic, MicOff, Calendar, Flag, Bell } from "lucide-svelte";
  import {
    objectives,
    type Objective,
    type Priority,
  } from "$lib/stores/objectives";
  import { defaultCategories, customCategories } from "$lib/stores/categories";
  import { t, lang } from "$lib/i18n";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import { portal } from "$lib/actions/portal";

  interface Props {
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  let title = $state("");
  let category = $state("General");
  let frequency = $state<Objective["frequency"]>("daily");
  let priority = $state<Priority>("medium");
  let isFavorite = $state(false);
  let reminderTime = $state("");
  let selectedDays = $state<number[]>([new Date().getDay()]);
  let dayOfMonth = $state(1);
  let monthOfYear = $state(0);
  let specificDate = $state(new Date().toISOString().split("T")[0]);
  let isOpen = $state(false);
  let isListening = $state(false);

  let allCategories = $derived([...defaultCategories, ...$customCategories]);

  const frequencies: { id: Objective["frequency"]; label: string }[] = [
    { id: "daily", label: $t.daily },
    { id: "weekly", label: $t.weekly },
    { id: "monthly", label: $t.monthly },
    { id: "yearly", label: $t.yearly },
    { id: "once", label: $t.once },
  ];

  const priorities: { id: Priority; label: string; color: string }[] = [
    { id: "low", label: $t.priorityLow, color: "var(--success)" },
    { id: "medium", label: $t.priorityMedium, color: "var(--warning)" },
    { id: "high", label: $t.priorityHigh, color: "var(--danger)" },
  ];

  const daysOfWeek = [
    { id: 1, label: $t.daysShort[1] },
    { id: 2, label: $t.daysShort[2] },
    { id: 3, label: $t.daysShort[3] },
    { id: 4, label: $t.daysShort[4] },
    { id: 5, label: $t.daysShort[5] },
    { id: 6, label: $t.daysShort[6] },
    { id: 0, label: $t.daysShort[0] },
  ];

  function toggleDay(id: number) {
    if (selectedDays.includes(id)) {
      selectedDays = selectedDays.filter((d) => d !== id);
    } else {
      selectedDays = [...selectedDays, id];
    }
  }

  function handleSubmit() {
    if (!title.trim()) return;
    objectives.add({
      title,
      category,
      frequency,
      priority,
      isFavorite,
      reminderTime: reminderTime || undefined,
      daysOfWeek: frequency === "weekly" ? selectedDays : undefined,
      dayOfMonth:
        frequency === "monthly" || frequency === "yearly"
          ? dayOfMonth
          : undefined,
      monthOfYear: frequency === "yearly" ? monthOfYear : undefined,
      date: frequency === "once" ? specificDate : undefined,
    });
    title = "";
    isFavorite = false;
    priority = "medium";
    isOpen = false;
    reminderTime = "";
    selectedDays = [new Date().getDay()];
  }

  function startSpeech() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");
    const recognition = new SpeechRecognition();
    recognition.lang = $lang;
    recognition.onstart = () => (isListening = true);
    recognition.onend = () => (isListening = false);
    recognition.onresult = (event: any) => {
      title = event.results[0][0].transcript;
    };
    recognition.start();
  }

  function focus(node: HTMLInputElement) {
    node.focus();
  }
</script>

<div class="add-trigger" class:compact>
  <Button
    variant="primary"
    onclick={() => (isOpen = true)}
    aria-label={$t.newObjective}
    title={$t.newObjective}
  >
    <Plus size={22} />
    {#if !compact}<span class="btn-text">{$t.newObjective}</span>{/if}
  </Button>
</div>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="modal-overlay animate-in"
    use:portal
    role="button"
    tabindex={-1}
    onclick={(e) => {
      if (e.target === e.currentTarget) isOpen = false;
    }}
    onkeydown={(e) => {
      if (e.key === "Escape") isOpen = false;
    }}
  >
    <div class="modal-content" role="none">
      <Card>
        <div class="form-header" role="none">
          <div class="header-title">
            <h3>{$t.newObjective}</h3>
            <button
              class="favorite-btn"
              class:active={isFavorite}
              onclick={() => (isFavorite = !isFavorite)}
            >
              <Flag
                size={20}
                fill={isFavorite ? "var(--danger)" : "none"}
                stroke={isFavorite ? "var(--danger)" : "currentColor"}
              />
            </button>
          </div>
          <button
            class="close-btn"
            onclick={() => (isOpen = false)}
            aria-label={$t.cancel}><X size={20} /></button
          >
        </div>
        <div class="form-body" role="none">
          <div class="input-wrapper" role="none">
            <input
              type="text"
              bind:value={title}
              placeholder={$t.placeholderTitle}
              class="input-main"
              use:focus
            />
            <button
              class="mic-btn"
              class:active={isListening}
              onclick={startSpeech}
              >{#if isListening}<MicOff size={20} />{:else}<Mic
                  size={20}
                />{/if}</button
            >
          </div>

          <div class="row-fields">
            <div class="field" role="none">
              <label for="priority">{$t.priority}</label>
              <select
                bind:value={priority}
                class="input-sub select-priority"
                style="border-left: 4px solid {priorities.find(
                  (p) => p.id === priority,
                )?.color}"
              >
                {#each priorities as p}<option value={p.id}>{p.label}</option
                  >{/each}
              </select>
            </div>
            <div class="field" role="none">
              <label for="frequency">{$t.frequency}</label>
              <select bind:value={frequency} class="input-sub">
                {#each frequencies as freq}<option value={freq.id}
                    >{freq.label}</option
                  >{/each}
              </select>
            </div>
          </div>

          <div class="row-fields">
            <div class="field" role="none">
              <label for="category">{$t.category}</label>
              <select bind:value={category} class="input-sub">
                {#each allCategories as cat}<option value={cat}
                    >{defaultCategories.includes(cat)
                      ? ($t.categories as any)[cat]
                      : cat}</option
                  >{/each}
              </select>
            </div>
            <div class="field" role="none">
              <label for="reminder">{$t.reminder}</label>
              <div class="time-picker-wrapper">
                <Bell size={16} class="time-icon" />
                <input
                  type="time"
                  bind:value={reminderTime}
                  class="input-sub time-input"
                />
              </div>
            </div>
          </div>

          {#if frequency === "once"}
            <div class="field animate-in" role="none">
              <label for="date">{$t.objectiveDate}</label>
              <div class="date-picker-custom" role="none">
                <Calendar size={18} /><input
                  type="date"
                  bind:value={specificDate}
                  class="input-sub-date"
                /><span>{specificDate}</span>
              </div>
            </div>
          {/if}
          {#if frequency === "weekly"}
            <div class="field animate-in" role="none">
              <label for="dayOfWeek">{$t.daysOfWeek}</label>
              <div class="options" role="none">
                {#each daysOfWeek as day}
                  <button
                    class="option-chip"
                    class:active={selectedDays.includes(day.id)}
                    onclick={() => toggleDay(day.id)}
                  >
                    {day.label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          {#if frequency === "monthly" || frequency === "yearly"}
            <div class="field animate-in" role="none">
              <label for="dayOfMonth"
                >{$t.dayOfMonth}
                {frequency === "monthly"
                  ? `(${$t.lastDayOfMonth} = 31)`
                  : ""}</label
              ><input
                type="number"
                min="1"
                max="31"
                bind:value={dayOfMonth}
                class="input-sub"
              />
            </div>
          {/if}
          {#if frequency === "yearly"}
            <div class="field animate-in" role="none">
              <label for="monthOfYear">{$t.month}</label><select
                bind:value={monthOfYear}
                class="input-sub"
                >{#each Array.from({ length: 12 }, (_, i) => i) as m}<option
                    value={m}
                    >{new Date(2024, m, 1).toLocaleDateString($lang, {
                      month: "long",
                    })}</option
                  >{/each}</select
              >
            </div>
          {/if}
          <Button
            variant="primary"
            onclick={handleSubmit}
            disabled={!title.trim()}>{$t.save}</Button
          >
        </div>
      </Card>
    </div>
  </div>
{/if}

<style>
  .add-trigger {
    margin-bottom: 0;
  }
  .add-trigger.compact :global(.btn) {
    padding: 0.6rem;
    aspect-ratio: 1;
    border-radius: 0.75rem;
    min-width: 44px;
  }
  .btn-text {
    margin-left: 0.5rem;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 1000;
    outline: none;
  }
  .modal-content {
    width: 100%;
    max-width: 500px;
  }
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
  .header-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .favorite-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: transform 0.2s;
    padding: 0.25rem;
    border-radius: 50%;
  }
  .favorite-btn:hover {
    transform: scale(1.1);
    background: rgba(239, 68, 68, 0.1);
  }
  .favorite-btn.active {
    color: var(--danger);
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
  }
  .form-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 80vh;
    overflow-y: auto;
    padding-right: 0.25rem;
  }
  .input-wrapper {
    position: relative;
    display: flex;
    gap: 0.5rem;
  }
  .input-main {
    flex: 1;
    background: var(--bg-primary);
    border: 2px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0.75rem;
    font-size: 1rem;
    color: var(--text-primary);
    outline: none;
  }
  .mic-btn {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0 0.75rem;
    color: var(--text-secondary);
  }
  .mic-btn.active {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
  .row-fields {
    display: flex;
    gap: 0.75rem;
  }
  .row-fields .field {
    flex: 1;
  }
  .input-sub {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.5rem;
    color: var(--text-primary);
    outline: none;
  }
  .select-priority {
    font-weight: 600;
  }
  .time-picker-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .time-input {
    padding-left: 2.25rem;
  }
  .date-picker-custom {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: var(--accent-primary);
  }
  .input-sub-date {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .option-chip {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 0.4rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .option-chip.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }
</style>
