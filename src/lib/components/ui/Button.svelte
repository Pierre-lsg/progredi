<script lang="ts">
  interface Props {
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    children?: any;
    [key: string]: any;
  }

  let { 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    onclick,
    children,
    ...rest 
  }: Props = $props();
</script>

<button
  {type}
  class="btn {variant} {size}"
  {disabled}
  {onclick}
  {...rest}
>
  {@render children?.()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Variants */
  .primary { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
  .primary:hover:not(:disabled) { background: var(--accent-secondary); border-color: var(--accent-secondary); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.3); }

  .secondary { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-color); }
  .secondary:hover:not(:disabled) { background: var(--bg-primary); border-color: var(--accent-primary); color: var(--accent-primary); }

  .ghost { background: transparent; color: var(--text-secondary); border: none; }
  .ghost:hover:not(:disabled) { background: var(--bg-secondary); color: var(--text-primary); }

  .danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }
  .danger:hover:not(:disabled) { background: var(--danger); color: white; border-color: var(--danger); }

  /* Sizes */
  .sm { padding: 0.4rem 0.75rem; font-size: 0.85rem; }
  .md { padding: 0.6rem 1.25rem; font-size: 0.95rem; }
  .lg { padding: 0.8rem 1.75rem; font-size: 1.1rem; }
</style>
