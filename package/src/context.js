/*
* src/context.js
*
* Collection of context (breadcrumbs, user, tags, ...) and exposing it to subpackages.
*/
import { fail } from './shared/fail'

// 'undefined' when the user is unknown (not set, yet)
// 'null' for a guest user. #tbd
//
/** @type User|null|undefined */    let currentUser;

/** @type Breadcrumb[] */           const currentBreadcrumbs = [];

/** @type {string[]|undefined} */   let _tags;
/** @type {string|undefined} */     let _appVersion;
/** @type {string|undefined} */     let _apiKey;

//--- User ---

/** @param {User} user
  @return {void}
*/
function setUser(user) {
  currentUser = user;
}

/** @return {User|undefined|null}
*/
function getCurrentUser() {
  return currentUser;
}

//--- Breadcrumbs ---

/** @param {Breadcrumb} crumb
  @return {void}
*/
function dropBreadcrumb(crumb) {

  // tbd. when to clear / limit the length of collected crumbs?
  currentBreadcrumbs.push(crumb);
}

/** @return {Breadcrumb[]}
*/
function getCurrentBreadcrumbs() {
  return currentBreadcrumbs;
}

/*--- Tags, App version etc. ---
*
* Things that are expected to be set only once at the initialization of the client. (client's rule, not Raygun's)
*/

/**
 * Initialize for providing just-once context (constant within the session).
 *
 * @param {string[]} tags
 * @param {string|undefined} appVersion
 * @param {string} apiKey
 * @return {void}
 */
function init({tags, appVersion, apiKey}) {
  (!_tags) || fail("'init' supposed to be called only once");

  Array.isArray(tags) || fail(`Bad 'tags' (expected Array of strings): ${tags}`);
  apiKey || fail(`API key missing or empty: ${apiKey}`);

  _tags = tags;
  _apiKey = apiKey;
  _appVersion = appVersion;
}

/** @return {string[]} */
function getTags() {
  return _tags || fail("not initialized");
}

/** @return {string|undefined} */
function getAppVersion() {
  return _appVersion;
}

/** @return {string} */
function getApiKey() {
  return _apiKey || fail('not initialized');
}

export {
  setUser,
  getCurrentUser,
    //
  dropBreadcrumb,
  getCurrentBreadcrumbs,
    //
  init,
  getTags,
  getAppVersion,
  getApiKey
}
