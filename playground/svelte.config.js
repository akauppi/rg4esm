/*
* Fashioned according to https://github.com/mvasigh/sveltekit-mdsvex-blog
*/
//import adapter from '@sveltejs/adapter-static'
import { mdsvex } from "mdsvex"

const extensions = [".smd"];

const o2 = {
  extensions,
  smartypants: {
    dashes: 'oldschool'   // tbd. explaaaaain!!??
  }
}

/** @type {import('@sveltejs/kit').Config}
*/
const o = {
  extensions: [".svelte", ...extensions],
  preprocess: [ mdsvex(o2) ],
  kit: {
    target: '#svelte',  // hydrate the <div id="svelte"> element in src/app.html
    //adapter: adapter(),
    prerender: {
      onError: 'continue'   // tbd. explain??
    }
  }
};

export default o;
