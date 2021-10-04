<!--
- src/pages/1/initialization.svelte
-
- Details for the initialization step.
-->

<Form>
  <!-- tbd. use CSS grid (native, not with Sveltestrap)
  -->
  <Row>
    <!-- remove
    <Col md="3">
      <Label for="I_apiKey" size="sm">Raygun API key</Label>
      <Input type="text" id="I_apiKey" bind:value={apiKey} placeholder="enter" style="font-family: monospace" />
    </Col>
    -->
    <Col md="1">
      <Label for="I_ver" size="sm">Version</Label>
      <Input type="text" id="I_ver" bind:value={version} placeholder="0.0.0" />
    </Col>
    <!-- tbd. How to apply styles to Sveltestrap components from 'style', not inline? #help
    - (ah, they may not have been designed for external styling...)
    -->
    <Col md="3">
      <Label for="I_tags" size="sm">Tags</Label>
      <Input type="text" id="I_tags" bind:value={tags} placeholder="swan,wolf,giraffe" />
    </Col>

  </Row>

  <Row style="margin-top: 1em;">
    <Col>
      <!-- tbd. make 'Button' inline without the 'span' work-around -->
      <span>
      <Button color="primary" disabled={ !apiKey } on:click={ initialize } >Initialize</Button>
      </span>

      <span id="status" style="margin-left: 0.6em"
         class:virgin={ initialized === undefined }
         class:fine={ initialized === true }
         class:error={ typeof initialized === 'string' }
      >
        {#if initialized === undefined}
          <!-- button not pressed / initialization ongoing -->
        {:else if initialized === true}
          ok
        {:else if typeof initialized === 'string'}
          ERROR: { initialized }
        {/if}
      </span>
    </Col>
  </Row>
</Form>

<!-- tbd. move to '1'
-->
{#if initialized === true}
  <div transition:fade style="margin-top: 1em;">
    <p>The Raygun client is now initialized.

    The context provided above (alongside automatically gathered context) is shipped to Raygun
      server with each caught Error or Real User Monitoring payload.</p>

    <p>Next, we'll send an <tt>Error</tt> to see they really get through.
    </p>
  </div>
{/if}

<style>
  #status.virgin { color: orange }
  #status.fine { color: green }
  #status.error { color: red }
</style>
  <!-- 'lang="scss"' would require 'svelte-preprocess'. We can live like this.
    tbd. Is there a native CSS syntax for nesting? -->

<script>
  import { Form, Input, Label, Button, Col, Row, Icon } from 'sveltestrap'
  import { init } from '@local/rg4esm'
  import { writable } from 'svelte/store'
  import { fade } from 'svelte/transition'

  const apiKey = import.meta.env.RAYGUN_API_KEY;
  let version = '';
  let tags = '';

  const store = writable();   // reactive of undefined | true | string
  $: initialized = $store;

  function initialize(ev) {   // (MouseEvent) => ()  ; 'initialized' set as a side effect, in a free-running tail

    // Note: This *cannot* be given as '|preventDefault' in the 'Button' 'on:click'. Otherwise:
    //  <<
    //    ValidationError: Event modifiers other than 'once' can only be used on DOM elements
    //  <<
    ev.preventDefault();

    const tagsStr = tags.split(',');

    console.debug("Initializing...");

    try {
      init(apiKey, {    // synchronous; no return code
        version,
        tags: tagsStr
      });
      $store = true;

    } catch(err) {
      $store = err.message;
    }
  }

  function fail(msg) { throw new Error(msg) }

  export {
    version,
    tags
  }
</script>
