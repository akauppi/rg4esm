/*
* src/index.js
*
* Main entry point.
*/
import { dispatchError } from './errorMonitoring'
//import { init as initRealUserMonitoring } from './realUserMonitoring'

import { setUser, dropBreadcrumb, init as initContext } from './context'

import { fail } from './shared/fail'

/**
* Initialize the client.
*
* @public
* @param {string} apiKey
* @param {string} appVersion
* @param {string[]} tags
* @param { {}|boolean } errorMonitoring
* @param { {}|boolean } realUserMonitoring
* @return {void}
*
* References:
*  - GlobalEventHandlers.onerror
*     -> https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
*/
function init(apiKey, { appVersion, tags = [], errorMonitoring = {}, realUserMonitoring = {} }) {

  // Convert config subset to '{...}' or 'false'
  const f = (x, debugName) =>
    (x === true) ? {} :
    (x === false || typeof x === 'object') ? x :
    fail(`Bad '${debugName}' (expecting {...}|bool): ${x}`);

  errorMonitoring = f(errorMonitoring);
  //realUserMonitoring = f(realUserMonitoring);

  initContext({apiKey, appVersion, tags});

  if (errorMonitoring) {

    window.onerror = function (message, source, lineno, colno, error) {
      console.log("Caught:", {message, source, lineno, colno, error});

      dispatchError(error).then( _ => {
        // also throw it!?!?
        throw error;
      })
    };
  }
}

export {
  init,
  setUser,
  dropBreadcrumb,
    //
  dispatchError as dispatchError_INTERNAL   // for playground
}
