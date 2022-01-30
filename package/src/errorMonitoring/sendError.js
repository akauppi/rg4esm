/*
* src/errorMonitoring/sendError.js
*
* Dispatch an Error to Raygun; potentially waiting until online.
*
* References:
*   - Raygun docs > Crash Reporting > API Reference
*     -> https://raygun.com/documentation/product-guides/crash-reporting/api
*/
import { genDispatcher } from '../shared/genDispatcher'

import { PACKAGE_NAME, PACKAGE_VERSION } from '../config'
import { getCurrentUser, getCurrentBreadcrumbs, getTags, getAppVersion } from "../context"

const rgEntriesURL = "https://api.raygun.com/entries";

let myDispatcher;

/**
 * Try to ship an Error. If no network, queued for later (automatic) delivery.
 *
 * @param {Error} error
 * @return {Promise<boolean>} Completes as 'true' if delivered on first try; 'false' if queued.
 */
async function sendError(error) {
  console.log("Getting error like this:", error);
  const err_message = error.message;  // string

  myDispatcher ||= genDispatcher( rgEntriesURL, "POST" );

  const now = new Date();

  // Compare with plain client implementation:
  //  - https://github.com/MindscapeHQ/raygun4js/blob/9b93586fb1df6ea43bcb38639dd7f23d3673cc41/src/raygun.js#L877-L919
  //
  const o = {
    occurredOn: now.toISOString(),     // "2021-11-08T17:57:29.184Z"

    details: {
      version: getAppVersion(),     // version of the [web] app

      //groupingKey: "ErrorGroup",  // "Client defined error grouping key. [...] 1-100 chars, ideally the result of a hash function [...]"

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
        //osVersion: "...",   // tbd.
        //resolutionScale:        // can we get this for a browser?? (plain client doesn't do it)
        //locale:     // "en-nz"|...
        utcOffset: new Date().getTimezoneOffset() / -60.0,   // (as per plain client 2.22.5)

        //browser: navigator.appCodeName,   // DEPRECATED. "All browsers return 'Mozilla' as the value of this property."
        //browserName: navigator.appName,   // DEPRECATED. "Always 'Netspace', in any browser"

        "browser-Version": navigator.appVersion,    // DEPRECATED
          // Safari 15 on macOS: "5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15"
          // Chrome 95 on macOS: "5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"

        platform: navigator.platform,
          // "Win32"|"MacIntel"|...

        // 'Browser-{Width|Height}' and 'Screen-{Width|Height}' omitted by purpose.
        // 'Color-Depth' omitted by purpose.

        // Fields mentioned in the plain client code (2.22.5) - but not in the API definition.
        //
        //"User-Language": navigator.userLanguage,    // "deprecated, ... consult docs for better alternative"
        //"Document-Mode": document.documentMode,     // ?? what is it? (not recognized by WebStorm IDE)
      },

      // "Tags that should be applied to the error. [...] searchable and filterable on the dashboard."
      //
      tags: getTags(),

      // "Any custom data [...] You can search on data entered here."
      //
      /*userCustomData: {   // tbd???
      },*/

      // "Information about the user [that caused the error]"  <-- really, Raygun plain client blames the User!!!?!?!!!
      // (rather: "who SUFFERS FROM the error!")
      //
      user: getCurrentUser(),

      breadcrumbs: getCurrentBreadcrumbs(),

      // 'Request' omitted by purpose, though plain client adds it.
      //
      // It's a server-side concept so carrying URL and some headers is a misuse of the data structure, at best. We don't.

      // 'machineName' omitted by purpose   // "The name of machine this error occurred on" - not relevant for browser app
    }
  }

  console.debug("Prepared for dispatch:", o);

  return myDispatcher(o).then( b => {
    console.debug( b ? "delivered at first try" : "queued for later")
    return b;
  });
}

export {
  sendError
}
