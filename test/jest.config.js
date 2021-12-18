// jest.config.js

const o = {
  // Recommended for native ES6 use: https://jestjs.io/docs/next/ecmascript-modules
  transform: {},

  // Default is 5000. None of our tests take that long; fail fast.
  testTimeout: 2000,

  // need to explicitly import 'test' etc.
  injectGlobals: false,

  // If '@local/package' only exposes one export, Jest 27.3+ is able to feed on it.
  //
  //resolver: "tools/jestResolver.cjs"
};
export default o;
