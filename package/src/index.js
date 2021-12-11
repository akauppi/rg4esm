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

  function conv(x, debugName) {
    if (x === true) return {};
    if (x === false) return false;
    fail(`Bad '${debugName}' (expecting {...}|bool): ${x}`)
  }
  errorMonitoring = conv(errorMonitoring);
  //realUserMonitoring = conv(realUserMonitoring);

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
