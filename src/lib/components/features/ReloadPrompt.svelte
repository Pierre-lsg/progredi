<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { RefreshCw, X, Download } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';
  import Button from '$lib/components/ui/Button.svelte';

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  function close() {
    needRefresh.set(false);
  }
</script>

{#if $needRefresh}
  <div class="pwa-toast" in:fly={{ y: 50, duration: 300 }} out:fade>
    <div class="toast-content">
      <div class="icon-container">
        <RefreshCw size={24} class="spin" />
      </div>
      <div class="text">
        <span class="title">Nouvelle version !</span>
        <span class="message">Mettez à jour pour profiter des dernières améliorations.</span>
      </div>
    </div>
    <div class="actions">
      <Button variant="ghost" size="sm" onclick={close}>Plus tard</Button>
      <Button variant="primary" size="sm" onclick={() => updateServiceWorker(true)}>
        Mettre à jour
      </Button>
    </div>
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--accent-primary);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 1rem;
    z-index: 5000;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    backdrop-filter: blur(10px);
  }

  .toast-content {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .icon-container {
    background: rgba(var(--accent-primary-rgb), 0.1);
    color: var(--accent-primary);
    padding: 0.75rem;
    border-radius: 0.75rem;
  }

  .spin {
    animation: spin 3s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .title {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .message {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  @media (max-width: 600px) {
    .pwa-toast {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
      max-width: none;
    }
  }
</style>
