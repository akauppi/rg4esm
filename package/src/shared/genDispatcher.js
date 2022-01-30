/*
* src/tools/genDispatcher.js
*
* Creates an object for delivering data to Raygun APIs.
*
* References:
*   - "Using fetch" (MDN)
*     -> https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
*/
import { getApiKey } from '../context'
import { fail } from './fail'

const initialCooldownMS = 500;
const maxCooldownMS = 30 * 1000;
const maxRetryMs = Number.MAX_SAFE_INTEGER;     // practically don't give up

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
   * @param {string} body Body, after 'JSON.stringify'
   * @param {number} depth 0..n; number of tries already taken
   * @return {Promise<boolean>} true if first call went through; false if needed to wait
   */
  async function thisF (body, depth = 0) {

    const resp = await fetch(url, {
      method,
      mode: 'cors',   // "cors"|"no-cors"|"*cors"|"same-origin"     <-- tbd. explain
      headers: {
        'Content-Type': 'application/json',
        'X-ApiKey': apiKey
      },
      body
    })
    .catch(err => {  // "reject on network failure or if anything prevented the request from completing"

      console.log("!!!", {err});

      const delay = cooldownMS(depth);

      waitMS(delay).then( _ => {
        const dt = Date.now() - t0;   // ms since first try
        (dt < maxRetryMs) || fail(`Waited enough offline (giving up): ${dt/1000} > ${maxRetryMs/1000}`);

        return thisF(body, depth+1)
          .then(_ => false);
      })
    });

    // Extract also body for debugging.
    //
    const respBody = await resp.text();

    // resp:
    //    { ok: false, status: 413 }    // payload too large
    //
    // tbd. analyze 'resp'
    console.log("!!!", {resp, body: respBody})

    if (!resp.ok) {
      console.debug("Call failure details", { ...resp, body: respBody })
      throw new Error(`Failed to send: status=${ resp.status }`)
    }

    return true;    // delivered
  }

  /**
   * Wrapper so that JSON conversion only happens once.
   *
   * @param {object} body
   * @return {Promise<boolean>} true if first call went through; false if needed to wait
   */
  return async (body) => {
    return thisF( JSON.stringify(body) );
  }
}

/**
* @param {number} ms
* @return {Promise<void>}
*/
const waitMS = (ms) => new Promise( res => {
  setTimeout(res, ms);
});

/**
 * Provide a waiting time for 'depth' (0..)
 *
 * @param {number} depth 0..n
 * @return {number} ms to wait before next attempt (progressively increasing, up to a limit)
 */
function cooldownMS(depth) {

  const ms = fibonacci(depth) * initialCooldownMS;
  return Math.max( ms, maxCooldownMS );
}

const arr = [1,1];   // fibonacci (seed)

function fibonacci(n) {
  if (!arr[n]) {
    arr[n] = fibonacci(n-1) + fibonacci(n-2);
  }
  return arr[n];
}

export {
  genDispatcher
}
