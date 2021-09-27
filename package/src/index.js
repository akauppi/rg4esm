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

const rgF = (name) => () => rg4js(name, ...arguments)

const rgSetUser = rgF('setUser');
const rgTrackEvent = rgF('trackEvent');

function init(opt) {
  const { apiKey } = opt; apiKey || fail("Missing '.apiKey' option");

  rg4js('apiKey', apiKey);
  rg4js('enableCrashReporting', true);
  rg4js('enablePulse', true);   // Real User Monitoring
  rg4js('saveIfOffline', true);

  const plainOpts = {
    automaticPerformanceCustomTimings: true,    // 'performance.measure'
  };

  const handle = {
    version(v) {
      rg4js('setVersion',v);
    },

    withTags(v) {   // (Array of string) => ()
      rg4js('withTags', v);
    },

    /*** not revealed
    // Note: These *not* usable for filtering, and there may be reason to have them change, during session (i.e.
    //    provide a generator function, here?
    //
    withCustomData(v) {   // ({ ... }) => ()      // tbd. types
      rg4js('withCustomData', v);
    },
    ***/

    collectBreadcrumbs(v) { // ({ console|navigation|clicks|network: boolean } | boolean) => ()

      const fGen = (name) => `${b ? 'enable':'disable' }AutoBreadcrumbs${ name }`;
      const m = new Map( Object.entries({
        console:    fGen('Console'),
        navigation: fGen('Navigation'),
        clicks:     fGen('Clicks'),
        network:    fGen('XHR')
      }))
      const validKeys = m.keys();

      if (typeof v === 'boolean') v = Object.fromEntries( validKeys.map( k => [k,v] ) );

      typeof v === 'object' || fail(`Unexpected value for '.collectBreadcrumbs' (expected 'object' or 'boolean'): ${v}`);

      const bad = Object.keys(v).filter( x => validKeys.find(x) < 0 );
      if (bad.length) {
        throw new Error(`Unexpected breadcrumb type(s): ${ bad.join(', ') }`)
      }

      m.forEach( ([k,f]) => {
        f(v[k]);
      })
    },

    ignore3rdPartyErrors(v) {   // (boolean) => ()
      plainOpts['ignore3rdPartyErrors'] = v;
    },
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

/*
* Inform change of current page, to Raygun.
*/
function setPage(path) {  // (string) => ()

  rgTrackEvent({ type: 'pageView', path });
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
  setPage
}


/***
 _setCookieAsSecure = true,   // if no localstorage, no sessionstorage, only use cookies for 'https'

 */
