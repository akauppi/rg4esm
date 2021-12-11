# rg4esm

<!-- (enable once published)
[![install size](https://packagephobia.com/badge?p=rg4esm)](https://packagephobia.com/result?p=rg4esm)
-->

<!-- package/README.md
- visible in npm registry
- for users; explains how to import and use the package
-->

A re-packaging of [`raygun4js`](https://www.npmjs.com/package/raygun4js) intended for projects that use ECMAScript Modules (ESM) natively in the browser.


## Design notes

The `raygun4js` API shows its age and layers (Oct 2021). This client started as a simple wrapper around it, but developed into more of a grooming exercise. The goal is to provide a **simple API** that's **fast to learn** and where things simply **work out of the box**.

This is in contrast with the pre-existing client. It's complicated and the relationship between client features and where it matters on the dashboard is not obvious (in the author's opinion, of course!).

In short, trying to make a client one can just "plug in" and use with one's app. Fast initial rewards.


### Feature comparison

||`rg4esm`|`raygun4js`|
|---|---|---|
|**Focus**|
|Works with ESM browser apps|yes|no (UMD requires bundling)|'
|Uses [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)|yes|optional; not on by default|
|offline aware|yes|optional; not on by default|
|page change observation|automatic|explicit, by calling [`rg4js('trackEvent', ...)`](https://raygun.com/documentation/language-guides/javascript/vuejs/#step-4-track-route-changes)|
|**Differences**|
|storing of unsent Errors|not over browser sessions `(*)`|stores in Local Storage; retrying if the site is visited again|
|Error reporting: `Request`|does not ship; considered a server-side feature|reports certain fields|
|**Abandoned**|
|IE support|no|IE10+; Crash Reporting supports IE8+|
|"jQuery hooks"|no|included, except in "vanilla" variant|

>`(*)`: There's no telling how long a gap a person might have between coming back to a web app. Therefore, no effort is taken to deliver Errors if the session is closed. Avoids shipping old errors.

You should be able to use the client simply by reading this page and studying the [sample application](http://github.com/akauppi/raygun4js-esm). 

For details on eg. specific Raygun options, consult the Raygun Language Guides > [JavaScript](https://raygun.com/documentation/language-guides/javascript/) page alongside this document.


### Relation to Raygun dashboard 

Raygun sells [three offerings](https://raygun.com/pricing):

- **Application Performance Monitoring**

   This is a **server side** offering, geared for tuning performance. It is not available for web apps and not interesting for this client.
   
- **Real User Monitoring**

   Customer sessions and information about your users' experience is under this partition.
   
   - Web Core Vitals

- **Error Monitoring & Crash Reporting**

   Observing unhandled exceptions that happen on the field. These should of course not happen.

This client has two goals with these offerings in mind:

- Being clear which feature maps to which Raygun offering.
- Improving - in gentle ways - the customer experience, kind of breaking the boundaries set forth by Raygun.

>Commercial product definition is always difficult. Which features should be in this package vs. the other. We blur the lines by:
>
>- adding user id to the "Error Monitoring & Crash Reporting" side as a custom data (otherwise custom data is not currently supported by this client). This allows you to see which user suffered from a particular error.
>- performance monitoring support though "Application Performance Monitoring" is not available for web apps.
>
>All of this is possible also with the plain API (we have no magic skills); it's just that we set the client up in a certain way, for you.



<!-- 
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

<_!-- tbd. what does "navigation events" and "clicks" mean?
--_>

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

<_!-- tbd. image. 

- large box: deployment (API key)
   - version: deployment variant
   		- browser, user location, ...
   		- current user
   			- current page
		- custom tags and data
--_>

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

	<_!-- tbd. How much of this is usable in RUM filtering?
	--_>
	
**5. Current page**

	<_!-- tbd. IF WE CAN DO THIS AUTOMATICALLY, MOVE TO UNDER 3. --_>

	>Note: We're checking if this can be gathered automatically.
	
   Collection of this data happens by adding a few lines in the Router. See [`trackEvent.pageView`](#trackEvent_pageView).

   <_!-- tbd. check the 2 links, above (in GitHub/npmjs.com) --_>
	<_!-- tbd. Is 'current page' usable in RUM filtering? Docs say "URL" is. --_>
	
**6. Custom tags**

   You can add tags to your application. These are strings attached to errors and can be used for filtering.
   
   <_!-- tbd. RG feature request. Why wouldn't tags be able to carry data? (and be filterable). E.g. "version" could be handled, this way.
   --_>

<_!-- tbd. Can tags/custom data be changed, during app lifespan, or are they constant? (in this client). Write something about that? --_>

<_!-- not revealed; it's only for errors; is there a use case??
**7. Custom data**

   Custom data are added to reported errors. They are **not for filtering** and not available on the Real User Monitoring side.
   
   *tbd. Write some use examples*
   
   <_!-- tbd. what types?
   -
   tbd. Should we allow changing custom data, during a user session?
   --_>
--_>

   Note: Raygun plain client automatically adds certain tags:
   
|tag|when|
|---|---|
|`UnhandledPromiseRejection`|Rejected promise|
-->

## Using in your project

```
$ npm install rg4esm
```

```
import { init } from "rg4esm"
```

>The package is only available as an ES module. Your build system must provide a suitable resolver. See the module's [GitHub repo](http://github.com/akauppi/raygun4js-esm) for a sample.


## Functionality

The APIs are divided in following categories:

||function|comment|
|---|---|---|
|Initialization|`init`|Call once|
|Setting&nbsp;the&nbsp;context|`setUser`|Call when the user changes|
||`customBreadcrumb`|Add custom content to breadcrumbs (trail potentially leading to an error), in addition to those automatically collected|
|Offline&nbsp;awareness|&dash;||


### Initialization

Since most of the functionality is on by default, initialization really is the most important part of the API - maybe the only thing you need to do.

```
import { init } from "rg4esm"
```

```
init( 
  apiKey: string, 
  {
    version: string,
    tags: Array of string,

    error: boolean | {
      collectBreadcrumbs: { "console"|"navigation"|"clicks"|"network": boolean } | boolean
    }

    rum: boolean | {
      sessionExpiresIn: /\d+\s*(?:ms|s|min)/,   // 'pulseMaxVirtualPageDuration'
      ignoreUrlCasing: boolean,		                // 'pulseIgnoreUrlCasing'
    }
  }?
)
```

`apiKey` validates your client's authority to push anything to Raygun but also identifies the *"app"* (a data collection) within Raygun dashboards. In a way, it is the largest context.

Configuration is divided between `error` (Error Monitoring & Crash Reporting) and `rum` (Real User Monitoring). If you don't have one of those offerings, set the value to `false`. By default, they are both enabled.

<!-- tbd. Do we need these (under 'error')
  ignore3rdPartyErrors: boolean,
  excludedHostnames: Array of string,
  excludedUserAgents: Array of string,
-->

<!-- tbd. Do we need these (under 'rum')
  captureMissingRequests: boolean
-->

>💊 API deviations: API key is provided with the `init` call (separate call in plain API). Configuration is divided by the offerings. Configuration entry names have been changed. Context is seen as a session constant (no `set` calls to change it, except for the user). Multiple breadcrumb options have been merged together (separate `disableAutoBreadCrumbs[...]` calls in Plain API). Options have been omitted, entirely.
>
>That.. means **everything is changed**.


#### Context options

|key|value|sample|default|
|---|---|---|---|
|`version`|`"<x>.<y>.<z>"`|`"1.0.0"`|`null`|
|`tags`|Array of string|`["sample tag"]`|`[]`|

Context information can be used in the Raygun Dashboard to narrow down (filter) the dataset.

In addition, tags are visible in the Dashboard: `Crash Reporting` > (error) > `Custom`.


#### Error Monitoring & Crash Reporting options

|key|value|sample|default|
|---|---|---|---|
|`collectBreadcrumbs`|`{ "console"|"navigation"|"clicks"|"network": bool } | bool`|`"{ console: true }"`|`true` (all enabled)|

Use this to steer the automatic breadcrumb collection.

Breadcrumbs provided trailing information about what happened before an error occurred. You can see them in the Dashboard at: `Crash Reporting` > (error) > `Breadcrumbs`.

<!--
|key|value|sample|default|comment|
|---|---|---|---|---|
|`ignore3rdPartyErrors`|boolean|`true`|`false`|from plain API|

|key|value|sample|default|
|---|---|---|---|
|`excludedHostnames`|Array? of string|`['localhost']`|`[]`|
|`excludedUserAgents`|Array? of string|`['some-test-agent']`|`[]`|

>Note: This seems to be geared towards exclusion of tracking in development/testing. Maybe we find other means for that.
-->

#### Real User Monitoring options

|key|value|sample|default|
|---|---|---|---|
|`sessionExpiresIn`|`"<number> {ms|s|min}"`|`10 min`|`30 min`|

A user session that is idle for longer than the provided value starts a new session (as seen in the Dashboard).

<!--REMOVE???
>Note: Raygun calls Real User Monitoring "pulse", in the implementation level.

- `pulseMaxVirtualPageDuration` is described (plain API docs) as: *"The maximum time a virtual page can be considered viewed, \[...\] (defaults to 30 minutes)."* 

   >💊 API Deviation: In plain API, `pulseMaxVirtualPageDuration` is given in milliseconds. Since this can lead to misunderstandings, this client requires a string with a unit.
-->

<!--
|`captureMissingRequests`|boolean|`true`|`false`|

- `captureMissingRequests` is a switch between two implementations of gathering network timings.

   `false` (default): uses `performance` API, and is said to not collect "all non-2xx timings (depending on browser)"
   
   `true`: track by "difference between send and success handlers"
   
   >This is the kind of complexity this client tries to avoid. Let's see which (modern) browsers really suffer from this, and whether we can drop the option.
   
  // tbd. Raygun: [ ] which browsers have these problems?

	"RUM uses the window.performance API to track XHR timing information and (depending on the browser) not all non-2XX XHR timings are recorded by this API."
-->


### Changing the context

Most of the application context is automatically gathered for you. You can then filter errors and user sessions, based on it.

>Note: Raygun Dashboard **does not** provide filtering by eg. user id. Is this intentional??

Change of user (logging in/out) is *not* one of the things the browser can automatically detect (there's no standard for handling authentication; it's app specific). For this reason, add a `setUser` call to your web app if you wish to be able to better distinguish user sessions in the Dashboard.


#### `setUser`

To tie Raygun reports to the real user id's in your authentication layer, inform the client when the user changes by calling `setUser`. Without this, you will see user sessions but won't be able to connect them to individual users - which may be helpful to ask them for more information, or to provide compensation in case they suffered from some errors.

```
import { setUser } from "rg4esm"
```

**User logs in**

```
setUser(uid: string);
setUser(uid: string, { email: string?, firstName: string?, fullName: string? });
```

We recommend using the first variant - only providing an opaque user id but no personal details.

You can still attach an error to a particular user by (manually) mapping the `uid` from Raygun with your user database. The difference is, whether you want to see this already in the Dashboard.


**User logs out**

```
setUser(null);
```

<!-- tbd. What exactly happens once we set user to `null`?  Check with demo.

After this call, Raygun continues to collect data to the same session, but it should now know that the person is no longer logged in.
-->

>Note: Raygun has a concept of "anynumous user". It is the same as "guest" user (no authentication whatsoever) in services such as Firebase Auth. This can be confusing.

>💊 API Deviation: Also Plain API has `setUser` but the calling signature is different. `isAnonymousUser` is omitted from our API.

>Raygun docs: *"The string properties on a User have a maximum length of 255 characters. Users who have fields that exceed this amount will not be processed."*

---

Current user is visible in the Dashboard in:

- `Crash Reporting` > (error) > `Custom` > `Custom data`
- `Real User Monitoring` > (user id)


<!--EVENTUALLY REMOVE (if automatic detection works); disabled in the hope we can detect it automatically
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
-->


### Custom Breadcrumbs

Raygun automatically collects certain events as breadcrumbs, to give context in case there's an error. See [Breadcrumbs in Raygun Crash Reporting](https://raygun.com/documentation/language-guides/javascript/crash-reporting/breadcrumbs/#breadcrumbs-in-raygun-crash-reporting) (Raygun docs).

Note that these are **not logs** since breadcrumbs are shipped to the Raygun service *only in case of an error*. Also, their number and size of contents are truncated.[^2]


You can add more information by:

```
import { customBreadcrumb } from "rg4esm"
```

```
customBreadcrumb(
  message: string,
  metadata: string|object|number|boolean|null|...?,
  options: {
  	 level: "debug"|"info"|"warning"|"error"?,
  	 location: string?
  }?
)
```

<!-- tbd. 
	- allowed types for `metadata`? Where do they show? #test all
	- what's the purpose of `options.level`?  Affect in Da Dashboard?
	- why should one place `options.location`?
-->

<!--
tbd. Explain metadata.
-->

[^2]: Raygun note: *"To prevent payloads becoming too large we only keep the most recent 32 breadcrumbs and also limiting the size of recorded network request/response text to 500 characters."*


### Plain `rg4js` API

The Plain API has calls not covered above. See Raygun > Language Guide > [JavaScript](https://raygun.com/documentation/language-guides/javascript/crash-reporting/advanced-setup/) for these.

<!-- Editor's note:
Using the deeper link (to Crash Reporting > Advanced Features) since JavaScript level doesn't have a good landing page (that would show the contents we want).
-->

You can use all the Plain client's features (At Your Own Risk) by:

```
import { rg4js } from 'rg4esm'
```

```
rg4js(cmd: string, ...);
```

>Note: Access to this function is *not* available in the Plain client for an ESM project without patching the client's sources - which we did.

This back-door is left open for the rare case where you'd like to use something that is not in the ESM abstraction. 

Samples of calls:

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

A bit deeper down, here are the options/calls that the author cannot imagine finding a good use, in an ESM browser application. But hey, he can be wrong!

Some of these are obvious (eg. due to dropping of IE support), while others may be needed but the author hasn't figured out the use case, yet.

For calls, you can use the `rg4js` plunge, as described above. For options, please file an Issue to discuss the need.

If anything, this works to show the complexity in the Plain client that the author struggled with!!! 🤯

||reason for leaving out|
|---|---|
|**Options**|
|`allowInsecureSubmissions`|IE specific (n/a)|
|`ignoreAjax{Abort\|Error}`|Caught (`false`) by default. What is the use case for wanting to ignore them? We'll be happy to have these as options, if there is a need.|
|`disableAnonymousUserTracking`|(#1)|
|`apiEndPoint`|Not sure how big the need is (advanced/enterprise feature)|
|`clientIp`|(follows `apiEndPoint`; both in or both out)|
|`automaticPerformanceCustomTimings`|Not supporting performance collection|
|`captureUnhandledRejections`||The default (`true`) should be fine.|
|`setCookieAsSecure`|n/a, since all browsers [support localstorage](https://caniuse.com/?search=localstorage)|
|`saveIfOffline`|We want to be offline savvy, always (`false` in Plain API). No need to switch it off.|
|`wrapAsynchronousCallbacks`|Author does not understand the purpose of it - after reading the docs. Four times. (#2)|
||
|**Calls**|
|`rg4js('setFilterScope', ...)`|Use case?|
|`rg4js('noConflict', true)`|not necessary|
|`rg4js('withCustomData', ...)`|using custom data only under the hood, to show user-id at Dashboard > `Crash Reporting`|
|`rg4js('send', ...)`|not revealed|
|`rg4js('setAutoBreadcrumbsXHRIgnoredHosts', ['hostname'])`||
|`rg4js('setBreadcrumbLevel', ['info'])`|could be necessary (as an option), but the name should reflect that this filters the breadcrumbs sent out (instead of chaning their default level when recorded); `setBreadcrumbLimit` or `shipBreadcrumbLevel`?|
|`rg4js('groupingKey', groupingKeyCallback)`|Can be useful (as an option)|
|`rg4js('getRaygunInstance')`|not necessary|

<small>
(#1): Our concept of "anonymous user" is one where `setUser` has been called, but with anonymous data (no email, only uid). This matches eg. Firebase's concept of an anonymous user. The Plain API docs, however, describe this as *"[...] for anonymous users (those where setUser hasn't been called)."*. We regard that as a user not logged in. Because of this confusion, and maybe no use case (is there?), leaving this out.

(#2): *"disables wrapping of async `setTimeout`/`setInterval` callbacks when set to false. Defaults to true. This option is respected when `attach()` is called."*
</small>


## Automatic features

### Context

In addition to the explicitly provided context (version and tags), the following are automatically collected:

- browser: `"Chrome"|...`
  - browser version: `"93.0.4577.82"`
- location:
	- country: `"FI (Finland)"`
	- state: `"Uusimaa"`
	- city: `"Helsinki"`
- anonymous user: `true` or `false`   <-- useful for filtering either "guests" or "authenticated" users
- operating system: `"Mac OS X"|...`
- URL: `"http://localhost:5000"`

>Note: We're ignoring the device id since it doesn't make that much sense for web apps - right?


### Offline support

All the features work seamlessly over periods of no network connectivity (think: shaky connection on a mobile network). **If they don't, it should be regarded as a bug.** Data is synced to Raygun once connectivity is back.

>Idea: We should help track lack of connectivity (timings), automatically, so the ops would know how many users feel it.
>
>..we **will** eventually end up also rewriting the client (no dependency on Plain API). It's unfortunate!!!

<!--
tbd. How much do we know about the "back"? Does Raygun wait a moment so that there's no initial burst right after reaching connectivity (rather give it to real needers - this is logging, after all). This could be an option for the client.
-->

## Terminology

- `Anonymous user`

   The plain client uses this term for a user *who has not logged in*. Raygun creates session id's automatically for such users.
   
   We prefer the term "guest", as used in Firebase Auth, and have removed references to "anonymous" in this client's API. Firebase Auth allows "anonymous login" (via a button with that title) which is a different thing than not being logged in, at all.
   
   ||logged in?|user id|
   |---|---|---|
   |guest|no|Raygun generated|
   |authenticated|yes|provided by your web app|

   >Think of this like a museum's entry fee. You have guests in the lobby, who are either not going to get in (just watching/shopping/having coffee) and people who buy the ticket. While the hotel personnel can identify the paid visitors by the ticket number, they don't necessarily know their name or other details, outside of the visit to the museum. Same with your web app.
   
   You will still face this terminology in the Raygun Dashboard, which allows filtering eg. sessions based on their "anonymity" (just read: guest or not). 
   

## Full disclosure

The author enjoys a free, 12 month trial license to Raygun services. No other contributions between the company and the author exist.


## References

- [Raygun Home page](https://raygun.com)
- [How to practically use Performance API to measure performance](https://blog.logrocket.com/how-to-practically-use-performance-api-to-measure-performance/) (blog, Oct 2019)


