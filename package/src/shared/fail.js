/*
* shared/fail.js
*/

/**
 * @param {string} msg
 * @private
 * @returns never
 */
function fail(msg) { throw new Error(msg) }

export {
  fail
}
