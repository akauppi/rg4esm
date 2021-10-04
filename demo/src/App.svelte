<!--
- src/App.svelte
-
- Note: No navigation links. We don't need them for testing the jump between pages.
-->
<Router {routes} />
<Styles />

<!--
- Needs 'svelte-preprocess' for SCSS support
--_>
<style lang="scss">
  /* Favour the (experimental) CSS Grid based engine -> https://getbootstrap.com/docs/5.1/layout/css-grid/ */
  $enable-grid-classes: false;
  $enable-cssgrid: true;

  /* Could also set: */
  $font-family-base: 'swiss';
  $font-size-root: 10px;
</style>
-->

<!-- disabled
<style>
  /* CSS variable overrides, see -> https://getbootstrap.com/docs/5.1/customize/css-variables/
  */
  :root {
    --bs-body-bg: "#123";   /* doesn't change anything */
  }
</style>
-->

<svelte:head>
  <!--
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootswatch@5.1.0/dist/flatly/bootstrap.min.css">

  <!_-- for using 'Icon' --_>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">
  -->

  <style>
    body {
      font-family: "Georgia", serif;
      margin-left: 2em;
      margin-right: 2em;
      margin-top: 1.3em;

      /* Bootstrap layout was a bit too large to my taste. Is there a Bootstrap-centric way of stepping it down?
      * This works.
      *_/
      transform: scale(0.9);
      transform-origin: 0 0;
      */
    }
  </style>
</svelte:head>

<style>
  :global(.tt) {
    font-family: monospace;
  }
</style>

<script>
  import Router from 'svelte-spa-router'
  import routes from './routes'
  import { Styles } from 'sveltestrap'
</script>
