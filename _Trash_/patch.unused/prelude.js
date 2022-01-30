var windw = window || global;
var originalOnError = windw.onerror;
windw.onerror = function (msg, url, line, col, err) {
  if (originalOnError) {
    originalOnError(msg, url, line, col, err);
  }

  if (!err) {
    err = new Error(msg);
  }

  windw['rg4js'].q = windw['rg4js'].q || [];
  windw['rg4js'].q.push({e: err});
};

// Similar approach as the snippet, creates the rg4js proxy function, which is exported in umd.outro.js once the
// script is executed, and later overwritten by the loader once it's finished
(function(wind) { wind['RaygunObject'] = 'rg4js';
  wind[wind['RaygunObject']] = wind[wind['RaygunObject']] || function() {
    if (wind && typeof wind['Raygun'] === 'undefined' ||
      (typeof document === 'undefined' || document.readyState !== 'complete')) {
      // onload hasn't been called, cache the commands just like the snippet
      (wind[wind['RaygunObject']].o = wind[wind['RaygunObject']].o || []).push(arguments)
    } else {
      // onload has been called and provider has executed, call the executor proxy function
      wind[wind['RaygunObject']](arguments[0], arguments[1]);
    }

  }})(windw);
