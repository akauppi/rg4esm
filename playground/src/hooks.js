/*
* handle.js
*
* Disable SSR, unconditionally.
*
* Note: This is against Svelte recommendations, but simplifies things since we don't need SEO.
*/

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const resp = await resolve(event, {
    ssr: false
  });

  return resp;
}
