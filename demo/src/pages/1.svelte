<!--
- src/pages/1.svelte
-->

<h1>RG/ESM integration demo</h1>

<p>
  Use this to test Raygun integration features.
</p>
<p>
  <Icon name="info-circle" /> Proceed from top to down. Make sure you have a Raygun dashboard open, and a project ("app") created just
    for this purpose. Check the boxes manually, if dashboard shows the intended details.
</p>

<Accordion>
  <AccordionItem active header="Initialization">
    <p>
      Initialization must be done once. It selects the Raygun project ("app") and provides context for the user session.
    </p>

    <Part_Initialization>
    </Part_Initialization>

  </AccordionItem>


  <!--
  <_!-- tbd. enable only when initialized; add 'active' (here!) when initialized
  --_>
  <AccordionItem header="Error Monitoring & Crash Reporting">

    <p>
      Now, let's send an <tt>Error</tt> and see what gets reported.
    </p>

    <Button primary onClick={ sendError }>Send an Error</Button>

    <p> <_!-- tbd. enable after the 'sendError' pressed --_>
      Please visit the Raygun console and see that these information got reported:

      - <CheckBox>Version: { contextVersion }</CheckBox>
      - <CheckBox>Tags: { contextTags }</CheckBox>
      - <CheckBox>Breadcrumbs:</CheckBox>
        - <CheckBox>console logging</CheckBox>
        - <CheckBox>network requests</CheckBox>
        - <CheckBox>navigation (page change)</CheckBox>
        - <CheckBox>"clicks"</CheckBox>
      - <CheckBox>Browser type, version</CheckBox>
      - <CheckBox>Country code</CheckBox>
      - <CheckBox>...What else???</CheckBox>

      Proceed to next step if these were shipped.
    </p>
  </AccordionItem>

  <AccordionItem header="Current User">
    <p>
      Raygun needs to be explicitly told about a current user. Do it here - this is of course just a fake authentication.
    </p>

    <input type="text" placeholder="fake-id" value:bind={ fakeId }/>

    <p>
      Then send an `Error`.
    </p>

    <Button primary onClick={ sendError }>Send an Error</Button>

    <p>
      Visit the Raygun dashboard to see the error.

      - <CheckBox>An error with `uid` "{ fakeId }" was seen</CheckBox>
    </p>

    <p>
      Next, let's check that SPA page information gets included the same way.
    </p>
  </AccordionItem>

  <AccordionItem>
    <p>
      The client should automatically record the URL of the page. To test this, please <a href="/#/2">move to a 2nd page</a>
      in this SPA (Single Page Application).
    </p>

    <p>   <_!-- tbd. enable when an Error button pressed on the 2nd page --_>
      Visit the Raygun dashboard to see the latest error.

      - <CheckBox>An error with page id `/#/2` was seen</CheckBox>
    </p>

    <p>
      Next, let's check Real User Monitoring.
    </p>
  </AccordionItem>

  <AccordionItem>
    <p>
      Raygun Real User Monitoring tracks eg. your page's load times. This should have happened already, automatically.

      - <CheckBox>There are recent entries of: ???tbd. metrics seen</CheckBox>
    </p>

    <p>
      Real User Monitoring also contains collection of Performance API tracking. The visit to the 2nd page was tracked
      in this way.

      - <CheckBox>There are timing entries of: ...how to describe? tbd...</CheckBox>
    </p>
  </AccordionItem>
  -->

</Accordion>

<p hidden>
  That is all.

  These tools should be enough for monitoring a web app in the wild. If you feel something from the Raygun Plain API
  is missing, [inform the author](mailto:akauppi@gmail.com).

  If you feel Raygun itself should have more features, create [an issue](https://github.com/MindscapeHQ/raygun4js/issues)
  for the Plain API.

  Be your bugs simple, and users happy!
</p>

<style>
  /* does not work
  #I_ver {
    max-width: 12em;
  }*/

  /* doesn't pick up.. *_/
  #context {
    width: 100px !important;
  }
  input.container-fixed {
    width: 50px !important;
  }*/
</style>

<script>
  import { Accordion, AccordionItem, Button, Icon } from "sveltestrap"

  import Part_Initialization from './1/0-initialization.svelte'

  import { /*_send, setUser*/ } from '@local/rg4esm'

  let fakeId;

  function sendError() {
    //_send( new Error("This is a DRILL. This is a DRILL.") )
  }
</script>
