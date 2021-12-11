/*
* context.js
*
* Collection of context (breadcrumbs, user, tags, ...) and exposing it to subpackages.
*
* Note: This needs to be initialized first.
*/

// tbd. #JSDoc types to the vars

/** @type User */
let currentUser;
/** @type Breadcrumb[] */
const currentBreadcrumbs = [];

/**
 * tbd. how to mark types here?
 * @_type {string[]|undefined} _tags
 */
let _tags;
let _appVersion;
let _apiKey;

import { fail } from './common'

/*--- User
*/
/** @param {User} userObj @return {void} */
function setUser(userObj) {
  currentUser = userObj;
}

/** @return {User|undefined|null} */
function getCurrentUser() {
  return currentUser;
}

/*--- Breadcrumbs
*/
/** @param {Breadcrumb} crumbObj @return {void} */
function dropBreadcrumb(crumbObj) {

  // tbd. when to clear / limit the length of collected crumbs?
  currentBreadcrumbs.push(crumbObj);
}

/** @return {Breadcrumb[]} */
function getCurrentBreadcrumbs() {
  return currentBreadcrumbs;
}

/*--- Tags, App version etc.
*
* Things that are expected to set only once - at the initialization of the client. (client's rule, not Raygun's)
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
