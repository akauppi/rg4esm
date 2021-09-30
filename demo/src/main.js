// main.js
//
// Entry point

import App from './App.svelte'
import { init /*, setPage*/ } from '@local/rg4esm'    // 'raygun4js-esm'

import { location } from 'svelte-spa-router'

const RAYGUN_API_KEY = "x";   //import.meta.env.RAYGUN_API_KEY;
const VERSION = "";

// Initialize Raygun as early as possible (before the App)
//
init( {
  apiKey: RAYGUN_API_KEY,
  version: VERSION,
  tags: ["demo"],

  enableBreadcrumbs: true
}, {

  // Enable this to see RG plain client logging
  //_debugMode: true
})

// Inform Raygun on client-side page changes
//
/*const unsub = */ location.subscribe( path => {

  console.debug("page changed:", path);   // "/" (initial load)
  //setPage(path);
})

const app = new App({
  target: document.body
})

export default app
