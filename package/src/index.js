/*
*
*/
//import mod from 'raygun4js/dist/raygun.vanilla'   // {}
//const mod = await import('raygun4js/dist/raygun.vanilla')   // { default: {} }

// NOTE: Must have the '.js' to pick up 'raygyn.vanilla.js' instead of the minified version (which may be patched).
//    Eventual app build will re-minify the code (what's left of it).

/***
import 'raygun4js/dist/raygun.vanilla.js'   // only side effects
  //
  // Raygun.
  //    Utilities
  //    NetworkTracking
  //    BreadCrumbs
  //    CoreWebVitals
  //    Rand
  //
  // TraceKit.
  //    setRaygun
  //    noConflict
  //    ...
  //
  // raygunBreadCrumbsFactory
  // raygunCoreWebVitalFactory
  // raygunNetworkTrackingFactory
  // raygunUtilityFactory

const rg = window.Raygun;
  //
  //
***/

// COULDN'T FIND A WAY TO USE THE 'vanilla' VERSION!!!
//
// Must declare 'windows['RaygunObject']' before importing to get access to the RG executor.
// This is cumbersome and not required in modern modules. Cannot do static 'import' with this mechanism.
//
//window['RaygunObject'] = 'rg4js'
//await import('raygun4js/dist/raygun.vanilla.js')  // top-level await

// UMD
//import 'raygun4js/dist/raygun.umd.js'
  //
  // window.rg4js

//import '../lib/raygun.umd.js'
//const rg4js = window.rg4js || fail("No 'rg4js' from the plain API")

import { rg4js } from '../lib/raygun.esm'

const rgGen = (name) => (...args) => { rg4js(name, ...args); }

const rgSetUser = rgGen('setUser');
const rgTrackEvent = rgGen('trackEvent');
const rgRecordBreadcrumb = rgGen('recordBreadcrumb');

/*
* Initialize the client.
*
* tbd. Because when this happens, we can expect connection to be online (the web app has just loaded). But then again,
*   web apps can be installed and launched offline. We need a mechanism (a callback that would be called if the API key
*   turns out to be bad). Or just 'alert' from the client - that works, too.
*/
function init(apiKey, opt = {}, { _debugMode } = {}) {    // (string, { ...opt }?) => ()    ; last parameter is undocumented
  apiKey || fail("Missing API key");

  rg4js('apiKey', apiKey);
  rg4js('enableCrashReporting', true);
  rg4js('enablePulse', true);   // Real User Monitoring
  rg4js('saveIfOffline', true);

  const plainOpts = {
    automaticPerformanceCustomTimings: true,    // 'performance.measure'
    debugMode: !!_debugMode,

    // These are "enabled by default" in the plain client. Here for completeness.
    trackCoreWebVitals: true,
    trackViewportDimensions: true
  };

  const handle = {
    version(v) {
      rg4js('setVersion',v);
    },

    tags(v) {   // (Array of string) => ()
      rg4js('withTags', v);
    },

    /*
    * v: {
    *   console: true|false,
    *   navigation: true|false,
    *   clicks: true|false,
    *   network: true|false|"full"    // "full" also ships contents
    * } | boolean
    *
    *   true (default) means:
    *     - all types; light network logging (no contents)
    */
    enableBreadcrumbs(v) {  // ( { <key>: boolean|"full" } | boolean) => ()
      const validKeys = ["console", "navigation", "clicks", "network"]

      if (v === true) {
        v = { console: true, navigation: true, clicks: true, network: true }
      } else if (v === false) {
        v = {}
      } else if (typeof v === 'object') {
        const badKeys = Object.keys(v).filter( k => !validKeys.contains(k) );

        if (badKeys.length) { fail(`Unexpected key(s): ${ badKeys.join(", ") }`) }
      } else {
        fail(`Unexpected value for '.enableBreadcrumbs' (expected 'object' or 'boolean'): ${v}`);
      }

      const nameGen = (name, b) => `${b ? 'enable':'disable' }AutoBreadcrumbs${ name }`;
      const pairs = [
        ['Console', v.console],
        ['Navigation', v.navigation],
        ['Clicks', v.clicks],
        ['XHR', v.network]
      ];
      pairs.forEach( ([k,b]) => { rg4js( nameGen(name,b) ) } );

      rg4js('logContentsOfXhrCalls', v.network === "full");   // collect network contents
    },

    // Note:
    //  'ignore3rdPartyErrors' is a misleading name, since errors within 3rd party libraries _called from the app_
    //    are still caught (and good so). This "ignores any errors that have no stack trace information".
    //
    //    - [ ] Be more precise, what this actually disables
    //    - [ ] Is it connected with 'whitelistCrossOriginDomains', in any way?
    //
    /* tbd. combine these to 'enable3rdPartyErrors':
rg4js('options', { ignore3rdPartyErrors: true });
rg4js('whitelistCrossOriginDomains', ['code.jquery.com']);
     */
    /*** CONSTRUCTION
    enable3rdPartyErrors(v) {   // (Array of string | true) => ()

      if (v === boolean) {
        plainOpts['ignore3rdPartyErrors'] = !v;
        whiteList = [];
      } else if (Array.isArray(v)) {
        whiteList = v;
      } else {
        fail(`Expected Array of string or boolean, got: ${v}`)
      }
    },***/

    excludedHostnames(v) {      // (Array of string) => ()
      plainOpts['excludeHostnames'] = v;
    },
    excludedUserAgents(v) {     // (Array of string) => ()
      plainOpts['excludeUserAgents'] = v;
    },

    pulseMaxVirtualPageDuration(v) {  // (string) => ()
      const [_,c1,c2] = /^(\d+)\s*(ms|s|min)$/.exec(v) ||
        fail(`Unexpected value for 'pulseMaxVirtualPageDuration' (not '{number} {ms|s|min}'): ${v}`);

      let vv = parseInt(c1);
      switch(c2) {
        case "ms": break;
        case "s": vv *= 1000; break;
        case "min": vv *= 60_000; break;
      }
      plainOpts['pulseMaxVirtualPageDuration'] = vv;
    },

    pulseIgnoreUrlCasing(v) { // (boolean) => ()
      plainOpts['pulseIgnoreUrlCasing'] = v;
    },

    captureMissingRequests(v) {   // (boolean) => ()
      plainOpts['captureMissingRequests'] = v;
    }
  }

  const bad= [];

  Object.entries(opt).forEach(([k,v]) => {
    const f = handle[k];
    if (f) {
      f(v);
    } else {
      bad.concat(`'${k}': ${v}`);
    }
  });
  if (bad.length) {
    throw new Error(`Bad option(s): ${ bad.join(', ') }`);
  }

  rg4js('options', plainOpts);

  // tbd. how to see that 'options' (and other rg4js calls) succeed?

  trackPageChanges();
}

/*
* Inform change of logged in user, to Raygun.
*
* 'setUser(null)'   no active user (logged out)
* 'setUser(id)'     anonymous user (or email and name must be fetched from the auth service, ie. Raygun doesn't have them)
* 'setUser(id, { email: string, firstName: string, fullName: string })  reveal info to Raygun
*/
function setUser(uid, opt) {  // (string|null, { email: string, firstName: string?, fullName: string? }?) => ()

  if (!uid) {
    rgSetUser(null);
  } else {
    const { email, firstName, fullName } = opt || {};
    const isAnon = !(email || firstName || fullName);

    rgSetUser(uid, isAnon, email, firstName, fullName, uid);
  }
}

/* REMOVE?
* Inform change of current page, to Raygun.
*_/
function setPage(path) {  // (string) => ()

  rgTrackEvent({ type: 'pageView', path });
}
***/

/*
* Track page changes.
*
* Since this is possible, the API doesn't need 'setPage'.
*/
function trackPageChanges() {

  // tbd. Make sure all kinds of URL changes are detected.

  // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange
  //
  window.addEventListener("hashchange", (ev) => {

    console.debug("Hash change detected:", ev);
      //
      // ev.newURL: 'http://localhost:5000/#/abc'

    const path = ev.newURL;
    rgTrackEvent({ type: 'pageView', path });

  }, false);
}

/*
* Record custom breadcrumb
*
* Apart from clicks, network access etc. record some application specific thingy that's worth knowing if there's an
* Error following it.
*/
function recordBreadcrumb( msg, metadata, opts) {   // (string, object|..., { level: "debug"|"info"|warning"|"error"?, location: string? }? ) => ()
  const level = opts?.level;
  //const location = opts?.location;
    // tbd. where does 'location' fit in?  What's its expected syntax?

  // tbd. Is this calling type available from Plain API?
  //
  rgRecordBreadcrumb({
    type: 'manual',
    level,
    message: msg
  });
}

function fail(msg) { throw new Error(msg) }

export {
  init,
  setUser,
  recordBreadcrumb
}


/***
 _setCookieAsSecure = true,   // if no localstorage, no sessionstorage, only use cookies for 'https'

*/
