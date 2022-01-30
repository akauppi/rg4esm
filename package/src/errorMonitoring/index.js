/*
* src/errorMonitoring/index.js
*/
import { sendError } from "./sendError"

/**
 * @param { ("console"|"navigation"|"clicks"|"network")[] } | boolean } [autoBreadCrumbs]
*/
function init({ autoBreadCrumbs }) {

  // tbd.
}

export {
  init,
  sendError
}
