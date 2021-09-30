import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import css from 'rollup-plugin-css-only'

const RAYGUN_API_KEY = process.env['RAYGUN_API_KEY'];   // can provide default to the input field

function fail(msg) { throw new Error(msg) }

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    name: 'app',
    format: 'esm',
    dir: 'dist/',
    chunkFileNames: '[name].js'
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      compilerOptions: {
        dev: true,
      },
    }),
    css({ output: 'bundle.css' } ),

    replace({
      'import.meta.env.RAYGUN_API_KEY': JSON.stringify(RAYGUN_API_KEY || null),

      preventAssignment: true
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve()
  ]
}
