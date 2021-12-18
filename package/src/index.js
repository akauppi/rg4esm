/*
* src/index.js
*
* Main entry point. Raygun offering specific functionality is implemented in:
*   - errorMonitoring
*   - realUserMonitoring
*/
import { init as initErrorMonitoring } from './errorMonitoring'
//import { init as initRealUserMonitoring } from './realUserMonitoring'

import { setUser, dropBreadcrumb, init as initContext } from './context'
import { init as initCatchErrors } from './catch'

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
 * @return {void}     // note: this doesn't show in the IDE..
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
    initCatchErrors();
  }
}

export {
  init,
  setUser,
  dropBreadcrumb
}
