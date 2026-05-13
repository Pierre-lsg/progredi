<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { portal } from '$lib/actions/portal';
  import Button from './Button.svelte';
  import Card from './Card.svelte';

  interface Props {
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
  }

  let { onConfirm, onCancel, title = "Modifications non enregistrées", message = "Voulez-vous enregistrer vos modifications avant de quitter ?" }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
  class="modal-overlay" 
  use:portal
  onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }} 
  onkeydown={(e) => { if (e.key === 'Escape') onCancel(); }}
  transition:fade={{ duration: 200 }} 
  role="button" 
  tabindex="-1"
>
  <div class="modal-content" in:scale={{ start: 0.9, duration: 200 }} out:scale={{ start: 0.9, duration: 150 }}>
    <Card padding="1.5rem">
      <div class="confirm-body">
        <h3>{title}</h3>
        <p>{message}</p>
        <div class="actions">
          <Button variant="secondary" onclick={onCancel}>Ignorer</Button>
          <Button variant="primary" onclick={onConfirm}>Enregistrer</Button>
        </div>
      </div>
    </Card>
  </div>
</div>

<style>
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .modal-content { width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
  .confirm-body { display: flex; flex-direction: column; gap: 1rem; text-align: center; }
  h3 { margin: 0; font-size: 1.1rem; color: var(--text-primary); }
  p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }
  .actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem; }
</style>
