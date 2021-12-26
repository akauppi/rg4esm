/*
* src/shared/fail.js
*/

/**
 * @param {string} msg
 * @returns never
 */
function fail(msg) { throw new Error(msg) }

export {
  fail
}
