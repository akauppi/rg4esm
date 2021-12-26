<!-- src/routes/__layout.svelte
-->
<nav>
  <a href="/error-capture">Error capture</a> ◆
  <a href="/context">Context</a>
  <!-- tbd. more to come -->
</nav>

<slot />

<style>
  /* ...Can have all kinds of styles here, see [1]
  *
  * [1]: https://github.com/mvasigh/sveltekit-mdsvex-blog/blob/main/src/routes/__layout.svelte

	:global(:root) { ... }
  :global(body) { ... }
  */
</style>

<script context="module">
  import { onMount } from 'svelte'
  import { init } from '@local/rg4esm'
  import { name, version } from "@local/package/package.json"
  const [PACKAGE_NAME, PACKAGE_VERSION] = [name, version];

  // Vite HMR may cause 'onMount' to be called multiple times (under development)
  let initialized = false;

  const [SSR, DEV] = [import.meta.env.SSR, import.meta.env.DEV];

  // import.meta.env.SSR |
  // ---                 | ---
  // true                | server side build
  // false               | client

  console.log("!!!", { SSR, DEV, initialized } );    // DEBUG

  /** @type {import('@sveltejs/kit').Load}
  */
  export async function load({ page, fetch, session, stuff }) {
    if (!SSR) {
      console.log("!!! load", { page, session, stuff, initialized });  // DEBUG

      if (import.meta.env.DEV && initialized) {
        console.log("Already initialized; skipping..");
        return {};
      }

      init( import.meta.env.VITE_RAYGUN_API_KEY, {
        tags: ["playground"]
      });

      console.log("!!! initialized");   // DEBUG
      initialized = true;
      return {}
    }
    return {}
  }
</script>
