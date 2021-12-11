<!--
- OnlineStatus.svelte
-
- An indicator for whether the browser page seems to be online or offline.
-
- Note: This is just mirroring the browser's reporting, which is not _all_ that the 'rg4esm' trusts. It will
-     try sends also when the state is reported as offline. It's complicated - and seeing how this indicator
-     behaves helps us understand the browsers.
-
- References:
-   - "Online and offline events" (MDN)
-     -> https://developer.mozilla.org/en-US/docs/Web/API/Navigator/Online_and_offline_events
-->
<div>
  { isOnline ? 'online':'offline' }
</div>

<style>
  div { background: gray }
</style>

<script>
  import { readable } from 'svelte/store';

  export const isOnline = readable(navigator.onLine, function start(set) {
    function updateStatus() {
      set(navigator.onLine);
    }
    window.addEventListener('online',  updateStatus);
    window.addEventListener('offline', updateStatus);

    return function stop() {};
  });

</script>
