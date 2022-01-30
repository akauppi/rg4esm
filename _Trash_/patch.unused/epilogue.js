const rg4js = window.rg4js || fail("No '.rg4js'");

// Note: Must leave 'window.rg4js' to exist, since the UMD-inherited loading mechanism uses it.
//window.rg4js = undefined;

function fail(msg) { throw new Error(msg) }

export { rg4js }
