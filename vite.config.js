// vite.config.js

export default {
  root: 'demo',

  resolve: {
    alias: {
      'rg4esm': '@local/package'
    },
  },

  build: {
    target: 'esnext'    // assumes native dynamic imports (default)
  },

  server: {
    port: 5000,
    strictPort: true
  },

  clearScreen: false
}
