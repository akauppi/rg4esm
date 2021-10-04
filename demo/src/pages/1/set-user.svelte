<!--
- src/pages/1/set-user.svelte
-
- Set a fake user (and send an error). Checks that user information is recorded.
-->

<p>
  Raygun is aware of the current user, if it's informed of user changes.
</p>
<p>
  Here, we check that:
</p>
<ul>
  <li>
    Errors are reported without user information when there's no logged in user.
  </li>
  <li>
    Errors are reported <u>with user information</u> if such is provided.
  </li>
</ul>

<p>
  The previous Error was sent without an active user. Note that <!-- tbd. where to see there's no user? -->
</p>

<p>
  Please provide a dummy user id and then send an Error.
</p>

<Input type="text" label="User id" placeholder="type any id here" bind:value={userId} on:change={ setUser }/>

<Button disabled={ !userId } color="primary" on:click={ sendError } style="margin-top: 1em">Create Error 2</Button>

{#if clicked === true}
  <div transition:fade style="margin-top: 1em;">
    Please visit the Raygun console and see that these information got reported:

    <li>Error with <span class="tt">within a user session</span> as the message
    </li>
    <li>
      ..with user id <span class="tt">{ userId }</span>
    </li>
  </div>

  <h3>Bonus</h3>
  <div>
    <p>Change the user id. Check that you see user sessions in <!--tbd. where in Raygun dashboard?--></p>
  </div>

  <hr />

  <p>
    In the next section, we turn pages.
  </p>
{/if}

<style>
  Button {    /* tbd. how to style 'Button'??? */
    margin: 3em;
  }
</style>

<script>
  import { Button, Input } from 'sveltestrap'
  import { _send, setUser as rgSetUser } from '@local/rg4esm'
  import { fade } from 'svelte/transition'

  let userId;

  $: clicked = false;

  function setUser() {
    rgSetUser(userId)   // sent as anonymous user (just id, not identifiable)

    //rgSetUser(userId, { email: 'abc@def.com', firstName: "Def" })   // sent with more (consider privacy!!!)
  }

  function sendError() {   // () => ()
    _send( new Error("within a user session") );
    clicked = true;
  }

  function fail(msg) { throw new Error(msg) }
</script>
