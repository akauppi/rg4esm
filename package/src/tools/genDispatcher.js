/*
* tools/genDispatcher.js
*
* Creates an object for delivering data to Raygun APIs. Takes care of queueing and eventual delivery (unless the browser
* is closed).
*
* References:
*   - "Using fetch" (MDN)
*     -> https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
*/
import { getApiKey } from '../context'

/**
 * Try to make a network request. If no network, queued for later (automatic) delivery.
 *
 * Completes as:
 *   - true if delivered (proof it's heared by Raygun)
 *   - false if queued (delivery will be attempted, but no guarantees; lost eg. if the user closes the browser).
 *
 * @param {string} url
 * @param {'POST'} method
 * @return {(Object) => Promise<bool>}
 */
function genDispatcher(url, method = 'POST') {
  const apiKey = getApiKey();

  return async (bodyObj) => {

    const resp = await fetch(url, {
      method,
      headers: {
        'X-ApiKey': apiKey
      }
    })
      .catch(err => {  // "reject on network failure or if anything prevented the request from completing"

    });
  }
}

export {
  genDispatcher
}
