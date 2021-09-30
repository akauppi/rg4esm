<!--
- src/pages/Page2.svelte
-->

<h1>RG/ESM integration demo (page 2)</h1>

<p>
  Great. This is the second page. Sending an error here should have the page URL as a context.
  <br />
  <button on:click={ sendAnError } >Send an error</button>
  <br />
  Once tested, <a href="/#">please return</a> to the main page.
</p>

<style>
  button {
    margin: 2em;
    color: red;
  }
  p {
    color: red
  }
</style>

<script>
  function sendAnError() {
    throw new Error("Error from page 2");
  }
</script>
