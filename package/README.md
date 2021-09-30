# rg4esm

<!-- (enable once published)
[![install size](https://packagephobia.com/badge?p=rg4esm)](https://packagephobia.com/result?p=rg4esm)
-->

<!-- package/README.md
- visible in npm registry
- for users; explains how to import and use the package
-->

A re-packaging of [Raygun4js](https://www.npmjs.com/package/raygun4js) intended for projects that use ECMAScript Modules (ESM) natively in the browser.


## API Design

The plain API (`raygun4js`) shows its age and layers. While we try to keep close to it, parity is not a requirement. At places, things have been re-organized, or even omitted, aiming for simplicity.

>💊 API deviation: Places where the APIs differ considerably are noted like this.

Feature comparison:

||`rg4esm`|plain `raygun4js`|
|---|---|---|
|IE support|nope|IE10+; Crash Reporting supports IE8+|
|"jQuery hooks"|nope|included, except in "vanilla" variant|
|[Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)|the only performance collecting API|not enabled by default (there's a custom API that is)|
|offline friendly|yes|not by default|
|page change (context)|automatic|explicit, with `rg4js('trackEvent', { type: 'pageView', ... })` <sub>[link](https://raygun.com/documentation/language-guides/javascript/vuejs/#step-4-track-route-changes)</sub>|

You should be able to use the client simply by reading this page and studying the [sample application](http://github.com/akauppi/raygun4js-esm). For details on eg. specific Raygun options, consult the Raygun Language Guides > [JavaScript](https://raygun.com/documentation/language-guides/javascript/) page alongside this document.


## Features / walkthrough

Raygun categorizes (and prices) features in the following way. We follow this in the API.

- [Error Monitoring & Crash Reporting](https://raygun.com/platform/crash-reporting)
- [Real User Monitoring](https://raygun.com/platform/real-user-monitoring)
- Application Performance Monitoring

   >Raygun [Application Performance Monitoring](https://raygun.com/documentation/product-guides/apm/introduction/) does *server side* performance profiling, analysing which parts of the source code take most of the time. This is not available for JavaScript clients. However, the Raygun Real User Monitoring can track `performance.measure` calls as [custom timings](https://raygun.com/documentation/language-guides/javascript/real-user-monitoring/custom-timings/#track-performancemeasure-calls-as-custom-timings) and [show the measurements](https://raygun.com/documentation/product-guides/real-user-monitoring/for-web/custom-timings/) in the Real User Monitoring dashboard. We regard this as performance monitoring, in this repo.


### Error Monitoring & Crash Reporting

---

>Error Monitoring & Crash Reporting helps answer the question: **"is our code stable, out there?"**.

---

As a developer, you don't need to do anything to enable this. Unexpected exceptions are caught and shipped to the Raygun service, for analysis.

#### Breadcrumbs

Breadcrumbs are added to the reported errors. These include events that preceded the error, in order to better understand it.

These events are collected automatically:

- `console.{log|warn|error}` calls
- network requests and responses
- navigation events
- clicks

<!-- tbd. what does "navigation events" and "clicks" mean?
-->

In addition, your code can provide custom breadcrumb data.

>Note: Breadcrumbs are lossy. Their number is restricted to 32 per error by the Raygun Plain client. They are not logs. They are only shipped to the Raygun service in case of errors.


### Real User Monitoring

---
>Real User Monitoring answers the question: **"what is the experience like, out there?"**

---

Real User Monitoring helps you to keep the user experience good, across all (most) users, and consistent over subsequent releases.

Without this tool, it would be easy to live in a "fairy land", thinking everything works smooth - because for the browsers/use cases the developers and managers have, it does. Real User Monitoring brings Reality to the mix.

Real User Monitoring is automatically enabled. You can provide more context by explicitly providing information about the logged in user (or lack thereof); see `setUser` below.


### Performance Monitoring

---

>Performance Monitoring answers the question: **"is performance out there as we expect it to be?"**

---

>This part is sold under the "Real User Monitoring" product, but we handle it separately in this client.

The difference to Real User Monitoring is that here, the developers decide which timings they are interested in, and have to explicitly add lines to the code.

To use Performance Monitoring, the standard [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance) is used.

Performance Monitoring requires you to add `performance.{mark|measure}` lines to your code.


### Context

Both Error Monitoring & Crash Reporting and Real User Monitoring output can be filtered by contextual information.

<!-- tbd. image. 

- large box: deployment (API key)
   - version: deployment variant
   		- browser, user location, ...
   		- current user
   			- current page
		- custom tags and data
-->

**1. API key**

   Raygun recommends using different API keys for different deployments (or local development environment). This is the outermost, implicit context.

**2. Version**

   Version of the web app.

**3. Automatically collected metadata**

   This includes: 
   
   - browser type
   - browser version
   - geographical location (country code; state; city)
   - operating system

**4. Current user**

   Providing this information is on you. See [`setUser`](#setUser).

	<!-- tbd. How much of this is usable in RUM filtering?
	-->
	
**5. Current page**

	<!-- tbd. IF WE CAN DO THIS AUTOMATICALLY, MOVE TO UNDER 3. -->

	>Note: We're checking if this can be gathered automatically.
	
   Collection of this data happens by adding a few lines in the Router. See [`trackEvent.pageView`](#trackEvent_pageView).

   <!-- tbd. check the 2 links, above (in GitHub/npmjs.com) -->
	<!-- tbd. Is 'current page' usable in RUM filtering? Docs say "URL" is. -->
	
**6. Custom tags**

   You can add tags to your application. These are strings attached to errors and can be used for filtering.
   
   <!-- tbd. RG feature request. Why wouldn't tags be able to carry data? (and be filterable). E.g. "version" could be handled, this way.
   -->

<!-- tbd. Can tags/custom data be changed, during app lifespan, or are they constant? (in this client). Write something about that? -->

<!-- not revealed; it's only for errors; is there a use case??
**7. Custom data**

   Custom data are added to reported errors. They are **not for filtering** and not available on the Real User Monitoring side.
   
   *tbd. Write some use examples*
   
   <_!-- tbd. what types?
   -
   tbd. Should we allow changing custom data, during a user session?
   --_>
-->

## Using in your project

```
$ npm install rg4esm
```

<!-- tbd. discuss the naming of the package
-->

```
import { init } from "rg4esm"
```

The package is only available as a pure ES module. Your build system must provide a suitable resolver (eg. Vite does). See the module's [GitHub repo](http://github.com/akauppi/raygun4js-esm) for a sample.


## APIs

### Initialization

Since most of the functionality is on by default, initialization really is the most important part of the API - maybe the only thing you need to do.

```
import { init } from "rg4esm"
```

```
init( apiKey: string, {
  // context
  version: string,
  tags: Array of string,

  // Error Monitoring & Crash Reporting
  collectBreadcrumbs: ["console"?, "navigation"?, "clicks"?, "network"?] | true | false,
  
  ignore3rdPartyErrors: boolean,
  excludedHostnames: Array of string,
  excludedUserAgents: Array of string,

  // Real User Monitoring
  pulseMaxVirtualPageDuration: /\d+\s*(?:ms|s|min)/,
  pulseIgnoreUrlCasing: boolean,
}? )
```

>💊 API deviations: API key is provided with the `init` call (separate call in plain API). Also other Plain API calls have been brought to be options (i.e. we don't anticipate them to be changed during the web app instance's lifespan). Breadcrumb options have been merged together (separate `disableAutoBreadCrumbs[...]` calls in Plain API). Some options have been omitted (see "Trash" section, at the end). 

<!-- tbd.
For some options, this client uses a narrower (better defined?) type description than the Plain API.

- tags are strings, not numbers (irrelevant?)
- custom data typing is not well defined in Plain API. But we omit it completely, for now.
-->

#### Context

<!-- Editor's note: 
values that apply to both Error Monitoring and Real User Monitoring.
-->

|key|value|sample|default|
|---|---|---|---|
|`apiKey`|string|`"PzE8...fYQ"`|none (must be provided)|
|`version`|`"<x>.<y>.<z>"`|`"1.0.0"`|`null`|

The API key validates your clients' authority to push anything to Raygun but also identifies the *"app"* (a data collection) within Raygun dashboards.

Version provides metadata to errors shipped to Raygun.


#### Error Monitoring & Crash Reporting options

|key|value|sample|default|
|---|---|---|---|
|`tags`|Array of string|`["sample tag"]`|`[]`|

<!-- tbd. Do tags bring context only to errors, or RUM as well? If RUM, lift to 'Context'.
-->

|key|value|sample|default|
|---|---|---|---|
|`enableBreadcrumbs`|`{ "console"|"navigation"|"clicks"|"network": true|"full" }|boolean`|`"{ console: true }"`|`true` (all enabled)|

<!-- tbd. Is this necessary?? -->
Use this to disable some kind of automatic breadcrumb collection.

|key|value|sample|default|comment|
|---|---|---|---|---|
|`ignore3rdPartyErrors`|boolean|`true`|`false`|from plain API|

|key|value|sample|default|
|---|---|---|---|
|`excludedHostnames`|Array? of string|`['localhost']`|`[]`|
|`excludedUserAgents`|Array? of string|`['some-test-agent']`|`[]`|

>Note: This seems to be geared towards exclusion of tracking in development/testing. Maybe we find other means for that.

#### Real User Monitoring options

|key|value|sample|default|
|---|---|---|---|
|`pulseMaxVirtualPageDuration`|`"<number> {ms|s|min}"`|`10 min`|`30 min`|
|`captureMissingRequests`|boolean|`true`|`false`|

>Note: Raygun calls Real User Monitoring "pulse", in the implementation level.

- `pulseMaxVirtualPageDuration` is described (plain API docs) as: *"The maximum time a virtual page can be considered viewed, \[...\] (defaults to 30 minutes)."* 

   >💊 API Deviation: In plain API, `pulseMaxVirtualPageDuration` is given in milliseconds. Since this can lead to misunderstandings, this client requires a string with a unit.

- `captureMissingRequests` is a switch between two implementations of gathering network timings.

   `false` (default): uses `performance` API, and is said to not collect "all non-2xx timings (depending on browser)"
   
   `true`: track by "difference between send and success handlers"
   
   >This is the kind of complexity this client tries to avoid. Let's see which (modern) browsers really suffer from this, and whether we can drop the option.
   
<!-- tbd. Raygun:
   - [ ] which browsers have these problems?
   
	"RUM uses the window.performance API to track XHR timing information and (depending on the browser) not all non-2XX XHR timings are recorded by this API."
	-->


### Changing the context

Most of the application context is gathered automatically, for you.

For some aspects of the app, this is not possible. Here, you must help by providing the changed context to the client, so it can be provided for eg. filtering in the Raygun console.

#### `setUser`

To tie Raygun reports to the real user id's in your authentication layer, inform the client when the user changes by calling `setUser`. Without this, you will see user sessions but won't be able to connect them to individual users - which may be helpful to ask them for more information, or to provide compensation in case they suffered from some errors.

```
import { setUser } from "rg4esm"
```

**User logged in**

```
setUser(uid: string, { email: string, firstName: string?, fullName: string? }?);
```

**User logged out**

```
setUser(null);		// user logged out
```

<!-- tbd. What exactly happens once we set user to `null`?  Check with demo.

After this call, Raygun continues to collect data to the same session, but it should now know that the person is no longer logged in.
-->

**Note:** Even if your application has access to the user's email and name in the runtime, it doesn't mean you necessarily need/want to inform Raygun about this. Consider what is good for customer privacy vs. good customer support.

Call the function with `null` to note that the user has logged out.

>Note: Raygun has a concept of "anynumous user". This does not necessarily match the definition of the same words in other services (thinking of Firebase Auth, here).

>💊 API Deviation: Also Plain API has `setUser` but the calling signature is different. `isAnonymousUser` is omitted from our API, deducing that information based on other fields (whether the email+names object is provided).

<!-- tbd. discuss these with RG? Especially the concept of "anonymous user".
--> 

>Raygun docs: *"The string properties on a User have a maximum length of 255 characters. Users who have fields that exceed this amount will not be processed."*


<!-- disabled in the hope we can detect it automatically
#### `setRoute`

```
import { setRoute } from "rg4esm"
```

```
setRoute( '/'+ window.location.pathname );
```

This tells the current page (URL) in a Single Page Application (SPA). Add this line to your client side router's page change callback (details depend on the libraries you use).

>API deviation: Plain API `trackEvent` takes a `{ type: 'pageView', path: string }` object.
-->

<!-- not important? Can be omitted / used via 'rg4js'
### Error reporting

Raygun listens for errors in the `onerror` handler. However, if you want to send one explicitly, do this:

```
import { send } from "rg4esm"
```

```
send({
  error: new Error("..."),
  tags: Array? of string,
  customData: { <key>: string|number|boolean|null }? 
  	| Array of { <key>: string|number|boolean|null }|string|number|boolean|null
  	| () => { <key>: string|number|boolean|null }
})
```

#### Adding tags

To tag the errors automatically captured:

```
import { withTags } from "rg4esm"
```

```
withTags( Array of string | () => Array of string )
```


#### Adding custom data

```
import { withCustomData } from "rg4esm"
```

```
withCustomData({ <key>: string|number|boolean|null } | Array of object|string|number|boolean|null | () => { <key>: string|number|boolean|null })
```

<!_-- tbd. what types can the values be? Date?
--_>

-->


### Custom Breadcrumbs (part of Error Monitoring & Crash Reporting)

Raygun automatically collects certain events as breadcrumbs, to give context in case there's an error. See [Breadcrumbs in Raygun Crash Reporting](https://raygun.com/documentation/language-guides/javascript/crash-reporting/breadcrumbs/#breadcrumbs-in-raygun-crash-reporting) (Raygun docs).

Note that these are **not logs** since breadcrumbs are shipped to the Raygun service *only in case of an error*. Also, their number and size of contents are truncated.[^2]


You can add more information by:

```
import { recordBreadcrumb } from "rg4esm"
```

```
recordBreadcrumb( message: string,
  metadata: string|object|number|boolean|null|...?,
  options: {
  	level: "debug"|"info"|"warning"|"error",
  	location: string
  }?
)
```

Default level is `info`.

<!-- tbd. allowed types for `metadata`? Where do they show? #test all
-->

>💊 API deviation: Different call signature.

<!-- tbd.
The plain API code allows calling with just one parameter (is this undocumented?). We always require separate `message` string and `metadata`.
-->
<!--
tbd. Explain metadata.
-->

[^2]: Raygun note: *"To prevent payloads becoming too large we only keep the most recent 32 breadcrumbs and also limiting the size of recorded network request/response text to 500 characters."*


### Performance Monitoring

Performance monitoring collects data via `performance.measure` calls. This includes data recorded before you load the Raygun client, so you can track loading performance with it.


#### Sample

```
performance.mark("a_t0")

# ... do something time-taking

performance.measure("a", "a_t0")
```

As you can see, the string `"a_t0"` is used as the indicator of the starting entry, instead of passing an actual entry to `.measure`. With two parameters, it calculates the difference between the two time points, and adds a [`PerformanceMeasure`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceMeasure) (MDN) entry to the browser's knowledge. The performance client can then summon such entries for shipment.


#### `performance.mark`

```
performance.mark( name: string )
```

Records a time stamp. Use this for marking a certain position in time.

#### `performance.measure`

```
performance.measure( name: string, startName: string|undefined, endName: string|undefined )
```

Records a duration between time stamps. If `endName` is omitted, uses current time.


### Plain `rg4js` API

The Plain API has calls not covered above. See Raygun > Language Guide > [JavaScript](https://raygun.com/documentation/language-guides/javascript/crash-reporting/advanced-setup/) for these.

<!-- Editor's note:
Using the deeper link (to Crash Reporting > Advanced Features) since JavaScript level doesn't have a good landing page (that would show the contents we want).
-->

You can use all the Plain client's features by:

```
import { rg4js } from 'rg4esm'
```

```
rg4js(cmd: string, ...);
```

>Note: Access to this function is *not* available in an ESM project without patching the plain client - which we do for you.

This back-door is left open for the rare case where you'd like to use something that is not in the ESM abstraction. Let the authors know, if you think it should be.

Samples of functionality only available via the plain bridge:

```
rg4js('filterSensitiveData', ['password', 'credit_card']);
rg4js('whitelistCrossOriginDomains', ['code.jquery.com']);  // ´ignore3rdPartyErrors´ option must be defined
rg4js('attach');
rg4js('detach');
rg4js('groupingKey', groupingKeyCallback);
rg4js('onBeforeSend', ...);
rg4js('onBeforeSendRUM', ...);
rg4js('onAfterSend', (xhrResponse) => ())
rg4js('onBeforeXHR', (xhr) => ())
rg4js('options', { automaticPerformanceCustomTimings: false })
```

### Trash

Here are the options/calls that the ESM wrapper does not currently implement. Some of these are obvious (eg. due to dropping of IE support), while others may be needed and the author has just done a cautious approach by keeping them out, until requests (with use cases) arise.

For calls, you can use the `rg4js` plunge, as described above. For options, please file an Issue/PR.

||reason for leaving out|
|---|---|
|**Options**|
|`allowInsecureSubmissions`|IE specific (n/a)|
|`ignoreAjax{Abort\|Error}`|Caught (`false`) by default. What is the use case for wanting to ignore them? We'll be happy to have these as options, if there is a need.|
|`disableAnonymousUserTracking`|(#1)|
|`disableErrorTracking`|always enabled|
|`disablePulse`|Real User Monitoring: always enabled|
|`apiEndPoint`|Not sure how big the need is (advanced/enterprise feature)|
|`clientIp`|(follows `apiEndPoint`; both in or both out)|
|`automaticPerformanceCustomTimings`|Collecting `performance.measure` always on (optional in Plain API) (n/a)|
|`captureUnhandledRejections`||The default (`true`) should be fine.|
|`setCookieAsSecure`|n/a, since all browsers [support localstorage](https://caniuse.com/?search=localstorage)|
|`saveIfOffline`|We want to be offline savvy, always. `true` by default (`false` in Plain API). No need to switch it off.|
|`pulseIgnoreUrlCasing`|Not sure it's needed|
|`wrapAsynchronousCallbacks`|Author does not understand the purpose of it - after reading the docs. (#2)|
||
|**Calls**|
|`rg4js('setFilterScope', ...)`|Use case?|
|`rg4js('noConflict', true)`|not necessary|
|`rg4js('enableCrashReporting', true)`|not necessary (always on)|
|`rg4js('enablePulse', true)`|not necessary (always on)|
|`rg4js('withCustomData', ...)`|just not revealed|
|`rg4js('send', ...)`|just not revealed|
|`rg4js('setAutoBreadcrumbsXHRIgnoredHosts', ['hostname'])`||
|`rg4js('setBreadcrumbLevel', ['info'])`|could be necessary (as an option), but the name should reflect that this filters the breadcrumbs sent out (instead of chaning their default level when recorded); `setBreadcrumbLimit` or `shipBreadcrumbLevel`?|
|`rg4js('groupingKey', groupingKeyCallback)`|Can be useful (as an option)|

<!--
|`rg4js('getRaygunInstance')`|not necessary|
-->

<small>
(#1): Our concept of "anonymous user" is one where `setUser` has been called, but with anonymous data (no email, only uid). This matches eg. Firebase's concept of an anonymous user. The Plain API docs, however, describe this as *"[...] for anonymous users (those where setUser hasn't been called)."*. We regard that as a user not logged in. Because of this confusion, and maybe no use case (is there?), leaving this out.

(#2): *"disables wrapping of async `setTimeout`/`setInterval` callbacks when set to false. Defaults to true. This option is respected when `attach()` is called."*
</small>


## Offline support

All the features work seamlessly over periods of no network connectivity (think: shaky connection on a mobile network). Data is synced to Raygun once connectivity is back.

>Idea: We should help track lack of connectivity (timings), automatically, so the ops would know how many users feel it.

<!--
tbd. How much do we know about the "back". Does Raygun wait a moment so that there's no initial burst right after reaching connectivity (rather give it to real needers - this is logging, after all). This could be an option for the client.
-->


## Full disclosure

The author enjoys a free, 12 month trial license to Raygun services. No other contributions between the company and the author exist.


## References

- [Raygun Home page](https://raygun.com)
- [How to practically use Performance API to measure performance](https://blog.logrocket.com/how-to-practically-use-performance-api-to-measure-performance/) (blog, Oct 2019)


