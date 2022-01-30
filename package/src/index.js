/*
* src/index.js
*
* Main entry point.
*/
import { setUser, dropBreadcrumb, init as initContext } from './context'
import { sendError, init as initErrorMonitoring } from './errorMonitoring'
import { init as initUserMonitoring } from './userMonitoring'

import { fail } from './shared/fail'

/**
* Initialize the client.
*
* @public
* @param {string} apiKey API key that defines the Raygun dashboard to get the collected data.
* @param {string?} version
* @param {string[]} tags
* @param { {}|boolean } errorMonitoring
* @param { {}|boolean } userMonitoring
* @return {void}
*
* References:
*  - GlobalEventHandlers.onerror
*     -> https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
*/
function init(apiKey, { version, tags = [], errorMonitoring = {}, userMonitoring = {} }) {

  // Convert config to '{...}' or 'false'
  const f = (x, debugName) =>
    (x === true) ? {} :
    (x === false || typeof x === 'object') ? x :
    fail(`Bad '${debugName}' (expecting {...}|bool): ${x}`);

  errorMonitoring = f(errorMonitoring);
  userMonitoring = f(userMonitoring);

  initContext({apiKey, appVersion: version, tags});

  if (errorMonitoring) initErrorMonitoring(errorMonitoring);
  if (userMonitoring) initUserMonitoring(userMonitoring);
}

export {
  init,
  setUser,
  dropBreadcrumb,
  sendError
}
