/*
* catch.js
*
* Catch uncaught exceptions and dispatch them to Raygun API.
*
* NOTE: This could be under 'errorMonitoring/' but the author felt it's more of an umbrella ("main level") feature.
*
* References:
*   - GlobalEventHandlers.onerror
*     -> https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
*/
import { dispatchError } from "./errorMonitoring/dispatchError"

/**
 * Activate error capture.
 *
 @return {void}
*/
function init() {

  window.onerror = function (message, source, lineno, colno, error) {
    console.log("Caught:", {message, source, lineno, colno, error});

    dispatchError(error).then( _ => {
      // also throw it!?!?
      throw error;
    })
  };
}

export { init }
