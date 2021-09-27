//
// routes.js
//
import Home from './pages/Home.svelte'
import Name from './pages/Name.svelte'
import Wild from './pages/Wild.svelte'
import NotFound from './pages/NotFound.svelte'

export default {
  '/main': Main,    // with Error button, login screen
  '/tab2': Tab2     // secondary

  // Catch-all, must be last
  '*': NotFound
}
