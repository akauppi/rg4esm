<!--
- src/pages/1/page-change.svelte
-
- Change to another page and back. Send error in that page so we know page changes get recorded.
-->

<!-- tbd. use CSS grid (native, not with Sveltestrap)
-->
<Button color="primary" on:click={ sendError } >Create Error</Button>

{#if clicked === true}
  <div transition:fade style="margin-top: 1em;">
    Please visit the Raygun console and see that these information got reported:

    <p>
      <Input type="checkbox" label="Can find error group: 'Clicked the button'" />
    </p>

    <Input type="checkbox" label="Error details" />
    <ul>
      <li>Version: <span class="tt">{ initVersion }</span></li>
      <li>Class name: <span class="tt">Error</span></li>
      <li>Stack trace</li>
    </ul>

    <Input type="checkbox" label="Environment" />
    <ul>
      <li>OS:</li>
      <li>Browser:</li>
      <li>Stack trace</li>
    </ul>

    <Input type="checkbox" label="Custom" />
    <ul>
      <li>Tags: <span class="tt">{ initTags }</span></li>
    </ul>

    <Input type="checkbox" label="Breadcrumbs" />
    <ul>
      <li>Console log</li>
      <li>UI Click</li>
    </ul>

    <p>If pleased with the results, carry on to the next section: page changes
    </p>
  </div>
{/if}

<style>
  .tt {
    font-family: monospace;
  }
</style>

<script>
  import { Button, Input } from 'sveltestrap'
  import { _send } from '@local/rg4esm'
  import { fade } from 'svelte/transition'

  $: clicked = false;

  function sendError() {   // () => ()
    console.log("Something clicked.");    // so we see logging goes to breadcrumbs (should)

    _send( new Error("Clicked the button") );
    clicked = true;
  }

  export let initVersion, initTags;

  function fail(msg) { throw new Error(msg) }
</script>
