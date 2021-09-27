// main.js
//
// Entry point

import App from './App.svelte'
import { init, setPage } from '@local/rg4esm'    // tbd. set up alias

import { location } from 'svelte-spa-router'

const RAYGUN_API_KEY = import.meta.env.RAYGUN_API_KEY;

// Initialize Raygun as early as possible (before the App)
//
init( {
  apiKey: RAYGUN_API_KEY
})

// Inform Raygun on client-side page changes
//
/*const unsub = */ location.subscribe( path => {

  console.debug("page changed:", path)
  setPage(path);
})

const app = new App({
  target: document.body
})

export default app
