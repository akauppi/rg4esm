/*
* Dispatch an Error to Raygun; potentially waiting until online.
*
* References:
*   - Raygun docs > Crash Reporting > API Reference
*     -> https://raygun.com/documentation/product-guides/crash-reporting/api
*/
import { genDispatcher } from '../tools/genDispatcher'

import { PACKAGE_NAME, PACKAGE_VERSION } from '../config'
import { getCurrentUser, getCurrentBreadcrumbs, getTags, getAppVersion } from "../context"

const rgURL = "https://api.raygun.com/entries";
const dispatcher = genDispatcher( rgURL, "POST" );

/**
 * Try to ship an Error. If no network, queued for later (automatic) delivery.
 *
 * Completes as:
 *   - true if delivered (proof it's heared by Raygun)
 *   - false if queued (delivery will be attempted, but no guarantees; lost eg. if the user closes the browser).
 *
 * @param {Error} error
 * @return {Promise<bool>}
 */
async function dispatchError(error) {

  console.log("Getting error like this:", error);
  const {
    message: /*as*/ err_message   // string
  } = error;

  const now = new Date();

  // Compare with plain client implementation:
  //  - https://github.com/MindscapeHQ/raygun4js/blob/9b93586fb1df6ea43bcb38639dd7f23d3673cc41/src/raygun.js#L877-L919
  //
  const o = {
    occurredOn: now.toISOString(),     // "2021-11-08T17:57:29.184Z"

    details: {
      //machineName: ...,           // "The name of machine this error occurred on"
      //groupingKey: "ErrorGroup",  // "Client defined error grouping key. [...] 1-100 chars, ideally the result of a hash function [...]"
      version: getAppVersion(),     // version of the [web] app

      client: {
        name: PACKAGE_NAME,
        version: PACKAGE_VERSION,
        //clientUrl: "..."    (could point to GitHub/npm but is this necessary? burdens _every_ report!!!)
      },

      // Error itself
      //
      // "[...] stacktrace must have its linenumber set. The other fields can be empty."
      //
      error: {
        //className: stackTrace.name, // tbd. AS PER PLAIN CLIENT
        message: err_message,
        //stackTrace: ...   // Array of { lineNumber, className, columnNumber, fileName, methodName }
          // tbd. AS PER PLAIN CLIENT
        //stackString:
          // tbd. AS PER PLAIN CLIENT
      },

      // "Information about the environment at the time of the error. Each of these properties are optional."
      //
      environment: {
        osVersion: "...",   // tbd.
        //resolutionScale:        // can we get this for a browser?? (plain client doesn't do it)
        //locale:     // "en-nz"|...
        utcOffset: new Date().getTimezoneOffset() / -60.0,   // (as per plain client 2.22.5)

        browser: navigator.appCodeName,
        browserName: navigator.appName,
        "browser-Version": navigator.appVersion,
        platform: navigator.platform,    // "Win32"|...

        // 'Browser-{Width|Height}' and 'Screen-{Width|Height}' omitted by purpose.
        // 'Color-Depth' omitted by purpose.

        // Fields mentioned in the plain client code - but not in the API definition.
        //
        "User-Language": navigator.userLanguage,    // "deprecated, ... consult docs for better alternative"
        "Document-Mode": document.documentMode,   // ?? what is it? (not recognized by WebStorm IDE)
      },

      // "Tags that should be applied to the error. [...] searchable and filterable on the dashboard."
      //
      tags: getTags(),

      // "Any custom data [...] You can search on data entered here."
      //
      /*userCustomData: {   // tbd???
      },*/

      // "Information about the user [that caused the error]" who SUFFERS FROM the error  <-- really, you blame the User!!!?!?!!!
      //
      user: getCurrentUser(),

      breadcrumbs: getCurrentBreadcrumbs(),

      // Note:
      //  Plain client adds 'Request', but it's a server-side concept so carrying URL and some headers is a misuse
      //  of the data structure, at best. We don't.
    }
  }

  console.debug("Prepared for dispatch:", { o });

  return dispatcher(o).then( b => {
    console.debug( b ? "delivered at first try" : "queued for later")
  });
}

export {
  dispatchError
}
