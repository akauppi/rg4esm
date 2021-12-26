/*
* srf/tools/genDispatcher.js
*
* Creates an object for delivering data to Raygun APIs. Takes care of eventual delivery (unless the browser is closed).
*
* References:
*   - "Using fetch" (MDN)
*     -> https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
*/
import { getApiKey } from '../context'
import { fail } from './fail'

const initialCooldownMS = 500;
const maxRetryMs = 999999999;     // practically - don't give up (~270h)

/**
* @type {integer[]} Cooldowns in ms, progressively increasing.
*/
const cooldownMS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144].map( x => x * initialCooldownMS );
  // (fibo without initial 1)

/**
 * Try to make a network request. If no network, queued for later (automatic) delivery.
 *
 * Completes as:
 *   - true if delivered on first try (heard by Raygun)
 *   - false if queued (delivery will be attempted, but no guarantees; lost e.g. if the user closes the browser).
 *
 * @param {string} url
 * @param {'POST'} method
 * @return {(object) => Promise<boolean>}
 */
function genDispatcher(url, method = 'POST') {
  const apiKey = getApiKey();

  const t0 = Date.now();  // ms

  /**
   * @param {object} bodyObj
   * @param {number} depth 0..n; number of tries already taken
   * @return {Promise<boolean>} true if first call went through; false if needed to wait
   */
  return async function thisF (bodyObj, depth = 0) {

    const resp = await fetch(url, {
      method,
      headers: {
        'X-ApiKey': apiKey
      }
    })
    .catch(err => {  // "reject on network failure or if anything prevented the request from completing"

      console.log("!!!", {err});
      debugger;

      const delay = cooldownMS[depth] || fail(`Internal: not enough wait stuff.`);

      waitMS(delay).then( _ => {
        const dt = Date.now() - t0;   // ms since first try
        (dt < maxRetryMs) || fail(`Waited enough offline (giving up): ${dt/1000} > ${maxRetryMs/1000}`);

        return thisF(bodyObj, depth+1)
          .then(_ => false);
      })
    });

    // tbd. analyze 'resp'
    console.log("resp", {resp})
    debugger;

    return true;
  }
}

/**
* @param {number} ms
* @return {Promise<void>}
*/
const waitMS = (ms) => new Promise( res => {
  setTimeout(res, ms);
});

export {
  genDispatcher
}
