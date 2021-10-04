// main.js
//
// Entry point

import App from './App.svelte'
//import { init /*, setPage*/ } from '@local/rg4esm'    // 'raygun4js-esm'

//import { location } from 'svelte-spa-router'

/** may not be needed
// Inform Raygun on client-side page changes
//
/_*const unsub = *_/ location.subscribe( path => {

  console.debug("page changed:", path);   // "/" (initial load)
  //setPage(path);
})
**/

const app = new App({
  target: document.body
})

export default app
