import { mdsvex } from "mdsvex"

const mdsvexConfig = {
  extensions: [".smd"],

  smartypants: false,    // 'true' (or leaving out) gives: "Unexpected character '’'"

  remarkPlugins: [],
  rehypePlugins: []
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ...mdsvexConfig.extensions],
  preprocess: [
    mdsvex(mdsvexConfig)
  ],
  kit: {
    ssr: false,
    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte'
  },
};

export default config;
