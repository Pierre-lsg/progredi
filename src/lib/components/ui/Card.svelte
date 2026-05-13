<script lang="ts">
  interface Props {
    padding?: string;
    children?: any;
    [key: string]: any;
  }

  let { padding = '1rem', children, ...rest }: Props = $props();
</script>

<div class="card glass animate-in" style="padding: {padding}" {...rest}>
  {@render children?.()}
</div>

<style>
  .card {
    border-radius: 1.25rem;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    width: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
  }
</style>
