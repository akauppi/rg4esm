<!--
- src/pages/Page2.svelte
-->

<h2>Page 2</h2>

<p>
  Your name is:
  <b>{params.first}</b>
  <b>{#if params.last}{params.last}{/if}</b>
</p>

<script>
// The params prop contains values matched from the URL
export let params = {}
</script>
