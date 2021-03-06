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
/*! Raygun4js - v2.22.5 - 2021-08-18
* https://github.com/MindscapeHQ/raygun4js
* Copyright (c) 2021 MindscapeHQ; Licensed MIT */
(function(window, undefined) {


var TraceKit = {};
var _oldTraceKit = window.TraceKit;

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';
var Raygun;


/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function _has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function _isUndefined(what) {
    return typeof what === 'undefined';
}

/**
 * TraceKit gets loaded before Raygun
 * Raygun uses this callback to give TraceKit an instance of Raygun
 * This is required to use the Utilities module
 */
TraceKit.setRaygun = function setRaygun(rg) {
    if (!Raygun) {
        Raygun = rg;
    }
};

/**
 * TraceKit.noConflict: Export TraceKit out to another variable
 * Example: var TK = TraceKit.noConflict()
 */
TraceKit.noConflict = function noConflict() {
    window.TraceKit = _oldTraceKit;
    return TraceKit;
};

/**
 * TraceKit.wrap: Wrap any function in a TraceKit reporter
 * Example: func = TraceKit.wrap(func);
 *
 * @param {Function} func Function to be wrapped
 * @return {Function} The wrapped func
 */
TraceKit.wrap = function traceKitWrapper(func) {
    function wrapped() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            TraceKit.report(e);
            throw e;
        }
    }
    return wrapped;
};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function reportModuleWrapper() {
    var handlers = [],
        lastException = null,
        lastExceptionStack = null;

    /**
     * Add a crash handler.
     * @param {Function} handler
     */
    function subscribe(handler) {
        installGlobalHandler();
        handlers.push(handler);
    }

    /**
     * Remove a crash handler.
     * @param {Function} handler
     */
    function unsubscribe(handler) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            if (handlers[i] === handler) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     * Dispatch stack information to all handlers.
     * @param {Object.<string, *>} stack
     */
    function notifyHandlers(stack, windowError) {
        var exception = null;
        if (windowError && !TraceKit.collectWindowErrors) {
          return;
        }
        for (var i in handlers) {
            if (_has(handlers, i)) {
                try {
                    handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
                } catch (inner) {
                    exception = inner;
                }
            }
        }

        if (exception) {
            throw exception;
        }
    }

    var _oldOnerrorHandler, _onErrorHandlerInstalled;

    /**
     * Ensures all global unhandled exceptions are recorded.
     * Supported by Gecko and IE.
     * @param {string} message Error message.
     * @param {string} url URL of script that generated the exception.
     * @param {(number|string)} lineNo The line number at which the error
     * occurred.
     */
    function traceKitWindowOnError(message, url, lineNo, columnNo, errorObj) {
        var stack = null;

        if (errorObj) {
          stack = TraceKit.computeStackTrace(errorObj);
        }
        else
        {
            if (lastExceptionStack) {
                TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
                stack = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
            } else {
                var location = {
                    'url': url,
                    'line': lineNo,
                    'column': columnNo
                };
                location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
                location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
                stack = {
                    'mode': 'onerror',
                    'message': message,
                    'url': document.location.href,
                    'stack': [location],
                    'useragent': navigator.userAgent
                };
            }
        }

        notifyHandlers(stack, 'from window.onerror');

        if (_oldOnerrorHandler) {
            return _oldOnerrorHandler.apply(this, arguments);
        }

        return false;
    }

    function installGlobalHandler ()
    {
        if (_onErrorHandlerInstalled === true) {
           return;
        }
        _oldOnerrorHandler = window.onerror;
        window.onerror = traceKitWindowOnError;
        _onErrorHandlerInstalled = true;
    }

    /**
     * Reports an unhandled Error to TraceKit.
     * @param {Error} ex
     */
    function report(ex) {
        var args;
        if (typeof document !== 'undefined') {
            args = _slice.call(arguments, 1);
        }

        if (lastExceptionStack) {
            if (lastException === ex) {
                return; // already caught by an inner catch block, ignore
            } else {
                var s = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [s, null].concat(args));
            }
        }

        var stack = TraceKit.computeStackTrace(ex);
        lastExceptionStack = stack;
        lastException = ex;

        // If the stack trace is incomplete, wait for 2 seconds for
        // slow slow IE to see if onerror occurs or not before reporting
        // this exception; otherwise, we will end up with an incomplete
        // stack trace
        window.setTimeout(function () {
            if (lastException === ex) {
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [stack, null].concat(args));
            }
        }, (stack.incomplete ? 2000 : 0));

        if (!Raygun.Utilities.isReactNative()) {
            throw ex; // re-throw to propagate to the top level (and cause window.onerror)
        }
        // Else case for this is handled in attach
    }

    report.subscribe = subscribe;
    report.unsubscribe = unsubscribe;
    return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
    var debug = false,
        sourceCache = {};

    /**
     * Attempts to retrieve source code via XMLHttpRequest, which is used
     * to look up anonymous function names.
     * @param {string} url URL of source code.
     * @return {string} Source contents.
     */
    function loadSource(url) {
        if (typeof url !== 'string') {
          return [];
        }

        return ''; // Remote fetching disabled due to deprecated synchronous XHR support in browsers
    }

    /**
     * Retrieves source code from the source code cache.
     * @param {string} url URL of source code.
     * @return {Array.<string>} Source contents.
     */
    function getSource(url) {
        if (!_has(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';

            url = url || "";

            var domain;
            if (typeof document !== 'undefined') {
                domain = document.domain;
            } else {
                domain = window.location.hostname;
            }

            if (url.indexOf && url.indexOf(domain) !== -1) {
                source = loadSource(url);
            }

            sourceCache[url] = source ? source.split('\n') : [];
        }

        return sourceCache[url];
    }

    /**
     * Tries to use an externally loaded copy of source code to determine
     * the name of a function by looking at the name of the variable it was
     * assigned to, if any.
     * @param {string} url URL of source code.
     * @param {(string|number)} lineNo Line number in source code.
     * @return {string} The function name, if discoverable.
     */
    function guessFunctionName(url, lineNo) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
            reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
            line = '',
            maxLines = 10,
            source = getSource(url),
            m;

        if (!source.length) {
            return UNKNOWN_FUNCTION;
        }

        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;

            if (!_isUndefined(line)) {
                if ((m = reGuessFunction.exec(line))) {
                    return m[1];
                } else if ((m = reFunctionArgNames.exec(line))) {
                    return m[1];
                }
            }
        }

        return UNKNOWN_FUNCTION;
    }

    /**
     * Retrieves the surrounding lines from where an exception occurred.
     * @param {string} url URL of source code.
     * @param {(string|number)} line Line number in source code to centre
     * around for context.
     * @return {?Array.<string>} Lines of source code.
     */
    function gatherContext(url, line) {
        var source = getSource(url);

        if (!source.length) {
            return null;
        }

        var context = [],
            // linesBefore & linesAfter are inclusive with the offending line.
            // if linesOfContext is even, there will be one extra line
            //   *before* the offending line.
            linesBefore = Math.floor(TraceKit.linesOfContext / 2),
            // Add one extra line if linesOfContext is odd
            linesAfter = linesBefore + (TraceKit.linesOfContext % 2),
            start = Math.max(0, line - linesBefore - 1),
            end = Math.min(source.length, line + linesAfter - 1);

        line -= 1; // convert to 0-based index

        for (var i = start; i < end; ++i) {
            if (!_isUndefined(source[i])) {
                context.push(source[i]);
            }
        }

        return context.length > 0 ? context : null;
    }

    /**
     * Escapes special characters, except for whitespace, in a string to be
     * used inside a regular expression as a string literal.
     * @param {string} text The string.
     * @return {string} The escaped string literal.
     */
    function escapeRegExp(text) {
        return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
    }

    /**
     * Escapes special characters in a string to be used inside a regular
     * expression as a string literal. Also ensures that HTML entities will
     * be matched the same as their literal friends.
     * @param {string} body The string.
     * @return {string} The escaped string.
     */
    function escapeCodeAsRegExpForMatchingInsideHTML(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)').replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    }

    /**
     * Determines where a code fragment occurs in the source code.
     * @param {RegExp} re The function definition.
     * @param {Array.<string>} urls A list of URLs to search.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceInUrls(re, urls) {
        var source, m;
        for (var i = 0, j = urls.length; i < j; ++i) {
            // console.log('searching', urls[i]);
            if ((source = getSource(urls[i])).length) {
                source = source.join('\n');
                if ((m = re.exec(source))) {
                    // console.log('Found function in ' + urls[i]);

                    return {
                        'url': urls[i],
                        'line': source.substring(0, m.index).split('\n').length,
                        'column': m.index - source.lastIndexOf('\n', m.index) - 1
                    };
                }
            }
        }

        // console.log('no match');

        return null;
    }

    /**
     * Determines at which column a code fragment occurs on a line of the
     * source code.
     * @param {string} fragment The code fragment.
     * @param {string} url The URL to search.
     * @param {(string|number)} line The line number to examine.
     * @return {?number} The column number.
     */
    function findSourceInLine(fragment, url, line) {
        var source = getSource(url),
            re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
            m;

        line -= 1;

        if (source && source.length > line && (m = re.exec(source[line]))) {
            return m.index;
        }

        return null;
    }

    /**
     * Determines where a function was defined within the source code.
     * @param {(Function|string)} func A function reference or serialized
     * function definition.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceByFunctionBody(func) {
        var urls = [window.location.href],
            scripts = document.getElementsByTagName('script'),
            body,
            code = '' + func,
            codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            re,
            parts,
            result;

        for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i];
            if (script.src) {
                urls.push(script.src);
            }
        }

        if (!(parts = codeRE.exec(code))) {
            re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
        }

        // not sure if this is really necessary, but I don???t have a test
        // corpus large enough to confirm that and it was in the original.
        else {
            var name = parts[1] ? '\\s+' + parts[1] : '',
                args = parts[2].split(',').join('\\s*,\\s*');

            body = escapeRegExp(parts[3]).replace(/;$/, ';?'); // semicolon is inserted if the function ends with a comment.replace(/\s+/g, '\\s+');
            re = new RegExp('function' + name + '\\s*\\(\\s*' + args + '\\s*\\)\\s*{\\s*' + body + '\\s*}');
        }

        // look for a normal function definition
        if ((result = findSourceInUrls(re, urls))) {
            return result;
        }

        // look for an old-school event handler function
        if ((parts = eventRE.exec(code))) {
            var event = parts[1];
            body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

            // look for a function defined in HTML as an onXXX handler
            re = new RegExp('on' + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

            if ((result = findSourceInUrls(re, urls[0]))) {
                return result;
            }

            // look for ???
            re = new RegExp(body);

            if ((result = findSourceInUrls(re, urls))) {
                return result;
            }
        }

        return null;
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * Added WinJS regex for Raygun4JS's offline caching support
     * Added stack string sanitization for React Native in release mode, for JavaScriptCore, which uses the Gecko regex
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        var parseError;

        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (.*?) ?\(((?:file|https?|\s*|blob|chrome-extension|native|webpack|ionic|app|eval|<anonymous>|\/).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|ionic|app|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i,
            winjs = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            lines = ex.stack.split('\n'),
            stack = [],
            parts,
            element,
            reference = /^(.*) is undefined$/.exec(ex.message);

        if (Raygun.Utilities.isReactNative()) {
            var reactNativeDevicePathStripRegex = /^(.*@)?.*\/[^\.]+(\.app|CodePush)\/?(.*)/;
            var sourcemapPrefix = 'file://reactnative.local/';

            for (var i = 0; i < lines.length; i++) {
                parts = reactNativeDevicePathStripRegex.exec(lines[i]);

                if (parts !== null) {
                    var functionName = parts[1] ? parts[1] : 'anonymous@';
                    var filenameLineNumAndColumnNum = parts[3];
                    lines[i] = functionName + sourcemapPrefix + filenameLineNumAndColumnNum;
                }
            }
        }

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[3],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'args': parts[2] ? parts[2].split(',') : '',
                    'line': +parts[4],
                    'column': parts[5] ? +parts[5] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else if ((parts = winjs.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else {
                continue;
            }

            if (!element.func && element.line) {
                element.func = guessFunctionName(element.url, element.line);
            }

            if (typeof document !== 'undefined' && element.line) {
                element.context = gatherContext(element.url, element.line);
            }

            stack.push(element);
        }

        if (stack[0] && stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        } else if (!stack[0].column && typeof ex.columnNumber !== 'undefined') {
            // Firefox column number
            stack[0].column = ex.columnNumber + 1;
        }

        if (!stack.length) {
            return null;
        }

        var res = {
            'mode': 'stack',
            'name': ex ? ex.name : '',
            'message': ex ? ex.message : '',
            'url': typeof document !== 'undefined' ? document.location.href : '',
            'stack': stack,
            'useragent': navigator ? navigator.userAgent : '',
            'stackstring': ex && ex.stack ? ex.stack.toString() : ''
        };

        return res;
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
            lines = stacktrace ? stacktrace.split('\n') : [],
            stack = [],
            parts;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'args': parts[5] ? parts[5].split(',') : [],
                    'url': parts[6]
                };

                if (!element.func && element.line) {
                    element.func = guessFunctionName(element.url, element.line);
                }
                if (element.line) {
                    try {
                        element.context = gatherContext(element.url, element.line);
                    } catch (exc) {}
                }

                if (!element.context) {
                    element.context = [lines[i + 1]];
                }

                stack.push(element);
            }
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stacktrace',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent,
            'stackstring': stacktrace
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            stack = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source;

        for (i in scripts) {
            if (_has(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
                var relativeLine = (+parts[1]); // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[parts[2] - 1];
                if (script) {
                    source = getSource(item.url);
                    if (source) {
                        source = source.join('\n');
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split('\n').length;
                        }
                    }
                }
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
                source = findSourceInUrls(re, [url]);
                item = {
                    'url': url,
                    'line': source ? source.line : line,
                    'func': ''
                };
            }

            if (item) {
                if (!item.func) {
                    item.func = guessFunctionName(item.url, item.line);
                }
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length / 2)] : null);
                if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
                    item.context = context;
                } else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i + 1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'mode': 'multiline',
            'name': ex.name,
            'message': lines[0],
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Adds information about the first frame to incomplete stack traces.
     * Safari and IE require this to get complete data on the first frame.
     * @param {Object.<string, *>} stackInfo Stack trace information from
     * one of the compute* methods.
     * @param {string} url The URL of the script that caused an error.
     * @param {(number|string)} lineNo The line number of the script that
     * caused an error.
     * @param {string=} message The error generated by the browser, which
     * hopefully contains the name of the object that caused the error.
     * @return {boolean} Whether or not the stack information was
     * augmented.
     */
    function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
        var initial = {
            'url': url,
            'line': lineNo
        };

        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func) {
                initial.func = guessFunctionName(initial.url, initial.line);
            }

            if (!initial.context) {
                initial.context = gatherContext(initial.url, initial.line);
            }

            var reference = / '([^']+)' /.exec(message);
            if (reference) {
                initial.column = findSourceInLine(reference[1], initial.url, initial.line);
            }

            if (stackInfo.stack.length > 0) {
                if (stackInfo.stack[0].url === initial.url) {
                    if (stackInfo.stack[0].line === initial.line) {
                        return false; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return false;
                    }
                }
            }

            stackInfo.stack.unshift(initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }

        return false;
    }

    /**
     * Computes stack trace information by walking the arguments.caller
     * chain at the time the exception occurred. This will cause earlier
     * frames to be missed but is the only way to get any stack trace in
     * Safari and IE. The top frame is restored by
     * {@link augmentStackTraceWithInitialElement}.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceByWalkingCallerChain(ex, depth) {
        var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
            stack = [],
            funcs = {},
            recursion = false,
            parts,
            item,
            source;

        for (var curr = computeStackTraceByWalkingCallerChain.caller; curr && !recursion; curr = curr.caller) {
            if (curr === computeStackTrace || curr === TraceKit.report) {
                // console.log('skipping internal function');
                continue;
            }

            item = {
                'url': null,
                'func': UNKNOWN_FUNCTION,
                'line': null,
                'column': null
            };

            if (curr.name) {
                item.func = curr.name;
            } else if ((parts = functionName.exec(curr.toString()))) {
                item.func = parts[1];
            }

            if (typeof item.func === 'undefined') {
              try {
                item.func = parts.input.substring(0, parts.input.indexOf('{'))
              } catch (e) { }
            }

            if ((source = findSourceByFunctionBody(curr))) {
                item.url = source.url;
                item.line = source.line;

                if (item.func === UNKNOWN_FUNCTION) {
                    item.func = guessFunctionName(item.url, item.line);
                }

                var reference = / '([^']+)' /.exec(ex.message || ex.description);
                if (reference) {
                    item.column = findSourceInLine(reference[1], source.url, source.line);
                }
            }

            if (funcs['' + curr]) {
                recursion = true;
            }else{
                funcs['' + curr] = true;
            }

            stack.push(item);
        }

        if (depth) {
            // console.log('depth is ' + depth);
            // console.log('stack is ' + stack.length);
            stack.splice(0, depth);
        }

        var result = {
            'mode': 'callers',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
        return result;
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     * @param {(string|number)=} depth
     */
    function computeStackTrace(ex, depth) {
        var stack = null;
        depth = (depth == null ? 0 : +depth);

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {
            'tracekitResult': 'failedToComputeAnyStackTrace'
        };
    }

    /**
     * Logs a stacktrace starting from the previous call and working down.
     * @param {(number|string)=} depth How many frames deep to trace.
     * @return {Object.<string, *>} Stack trace information.
     */
    function computeStackTraceOfCaller(depth) {
        depth = (depth == null ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            throw new Error();
        } catch (ex) {
            return computeStackTrace(ex, depth + 1);
        }
    }

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
}());

/**
 * Extends support for global error handling for asynchronous browser
 * functions. Adopted from Closure Library's errorhandler.js
 */
TraceKit.extendToAsynchronousCallbacks = function () {
    var _helper = function _helper(fnName) {
        var originalFn = window[fnName];
        window[fnName] = function traceKitAsyncExtension() {
            // Make a copy of the arguments
            var args = _slice.call(arguments);
            var originalCallback = args[0];
            if (typeof (originalCallback) === 'function') {
                args[0] = TraceKit.wrap(originalCallback);
            }
            // IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
            // also only supports 2 argument and doesn't care what "this" is, so we
            // can just call the original function directly.
            if (originalFn.apply) {
                return originalFn.apply(this, args);
            } else {
                return originalFn(args[0], args[1]);
            }
        };
    };

    _helper('setTimeout');
    _helper('setInterval');
};

//Default options:
if (!TraceKit.remoteFetching) {
  TraceKit.remoteFetching = true;
}
if (!TraceKit.collectWindowErrors) {
  TraceKit.collectWindowErrors = true;
}
if (!TraceKit.linesOfContext || TraceKit.linesOfContext < 1) {
  // 5 lines before, the offending line, 5 lines after
  TraceKit.linesOfContext = 11;
}



// Export to global object
window.TraceKit = TraceKit;

}(window));

(function traceKitAsyncForjQuery($, TraceKit) {
  'use strict';
  // quit if jQuery isn't on the page
  if (!$ || !$.event || !$.event.add) {
    return;
  }

  var _oldEventAdd = $.event.add;
  $.event.add = function traceKitEventAdd(elem, types, handler, data, selector) {
    if (typeof handler !== 'function' && typeof handler.handler !== 'function') {
      return _oldEventAdd.call(this, elem, types, handler, data, selector);
    }

    var _handler;

    if (handler.handler) {
      _handler = handler.handler;
      handler.handler = TraceKit.wrap(handler.handler);
    } else {
      _handler = handler;
      handler = TraceKit.wrap(handler);
    }

    // If the handler we are attaching doesn???t have the same guid as
    // the original, it will never be removed when someone tries to
    // unbind the original function later. Technically as a result of
    // this our guids are no longer globally unique, but whatever, that
    // never hurt anybody RIGHT?!
    if (_handler.guid) {
      handler.guid = _handler.guid;
    } else {
      handler.guid = _handler.guid = $.guid++;
    }

    return _oldEventAdd.call(this, elem, types, handler, data, selector);
  };

  var _oldReady = $.fn.ready;
  $.fn.ready = function traceKitjQueryReadyWrapper(fn) {
    return _oldReady.call(this, TraceKit.wrap(fn));
  };

  var _oldAjax = $.ajax;
  $.ajax = function traceKitAjaxWrapper(url, options) {
    if (typeof url === "object") {
      options = url;
      url = undefined;
    }

    options = options || {};

    var keys = ['complete', 'error', 'success'], key;
    while(key = keys.pop()) {
      if ($.isFunction(options[key])) {
        options[key] = TraceKit.wrap(options[key]);
      }
    }

    try {
      return (url) ? _oldAjax.call(this, url, options) : _oldAjax.call(this, options);
    } catch (e) {
      TraceKit.report(e);
      throw e;
    }
  };

}(window.jQuery, window.TraceKit));

// Mozilla's toISOString() shim for IE8
if (!Date.prototype.toISOString) {
    (function () {
        function pad(number) {
            var r = String(number);
            if (r.length === 1) {
                r = '0' + r;
            }
            return r;
        }

        Date.prototype.toISOString = function () {
            return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + 'Z';
        };
    }());
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;

        if (len === 0) {
            return -1;
        }
        var n = fromIndex | 0;

        if (n >= len) {
            return -1;
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        while (k < len) {
            if (k in o && o[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {
    Array.prototype.map = function(callback/*, thisArg*/) {
        var T, A, k;

        if (this == null) {
            throw new TypeError('this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = arguments[1];
        }

        A = new Array(len);
        k = 0;

        while (k < len) {
            var kValue, mappedValue;

            if (k in O) {
                kValue = O[k];

                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }

        return A;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback/*, thisArg*/) {
        var T, k;

        if (this == null) {
            throw new TypeError('this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = arguments[1];
        }

        k = 0;
        while (k < len) {
            var kValue;

            if (k in O) {
                kValue = O[k];

                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

// Mozilla's bind() shim for IE8
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            FNOP = function () {
            },
            fBound = function () {
                return fToBind.apply(this instanceof FNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        FNOP.prototype = this.prototype;
        fBound.prototype = new FNOP();

        return fBound;
    };
}

(function() {
  // Raygun: This ensures that we do not initialize Core Web Vitals for non-browser environments
  if (typeof document === 'undefined') {
    return;
  }

  var firstInputEvent;
  var firstInputDelay;
  var firstInputTimeStamp;
  var callbacks;
  var listenerOpts = { passive: true, capture: true };
  var startTimeStamp = new Date;
  var firstInputPolyfill = function firstInputPolyfill(onFirstInput) {
    callbacks.push(onFirstInput);
    reportFirstInputDelayIfRecordedAndValid();
  };
  var resetFirstInputPolyfill = function resetFirstInputPolyfill() {
    callbacks = [];
    firstInputDelay = -1;
    firstInputEvent = null;
    eachEventType(addEventListener);
  };
  var recordFirstInputDelay = function recordFirstInputDelay(delay, event) {
    if (!firstInputEvent) {
      firstInputEvent = event;
      firstInputDelay = delay;
      firstInputTimeStamp = new Date;
      eachEventType(removeEventListener);
      reportFirstInputDelayIfRecordedAndValid();
    }
  };
  var reportFirstInputDelayIfRecordedAndValid = function reportFirstInputDelayIfRecordedAndValid() {
    if (firstInputDelay >= 0 && firstInputDelay < firstInputTimeStamp - startTimeStamp) {
      var entry = {
        entryType: 'first-input',
        name: firstInputEvent.type,
        target: firstInputEvent.target,
        cancelable: firstInputEvent.cancelable,
        startTime: firstInputEvent.timeStamp,
        processingStart: firstInputEvent.timeStamp + firstInputDelay,
      };
      callbacks.forEach((function(callback) {
        callback(entry);
      }));
      callbacks = [];
    }
  };
  var onPointerDown = function onPointerDown(delay, event) {
    var onPointerUp = function onPointerUp() {
      recordFirstInputDelay(delay, event);
      removePointerEventListeners();
    };
    var onPointerCancel = function onPointerCancel() {
      removePointerEventListeners();
    };
    var removePointerEventListeners = function removePointerEventListeners() {
      removeEventListener('pointerup', onPointerUp, listenerOpts);
      removeEventListener('pointercancel', onPointerCancel, listenerOpts);
    };
    addEventListener('pointerup', onPointerUp, listenerOpts);
    addEventListener('pointercancel', onPointerCancel, listenerOpts);
  };
  var onInput = function onInput(event) {
    if (event.cancelable) {
      var isEpochTime = event.timeStamp > 1e12;
      var now = isEpochTime ? new Date : performance.now();
      var delay = now - event.timeStamp;
      if (event.type == 'pointerdown') {
        onPointerDown(delay, event);
      } else {
        recordFirstInputDelay(delay, event);
      }
    }
  };
  var eachEventType = function eachEventType(callback) {
    var eventTypes = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
    eventTypes.forEach((function(type) {
      return callback(type, onInput, listenerOpts);
    }));
  };
  var firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
  var onVisibilityChange = function onVisibilityChange(event) {
    if (document.visibilityState === 'hidden') {
      firstHiddenTime = event.timeStamp;
      removeEventListener('visibilitychange', onVisibilityChange, true);
    }
  };
  addEventListener('visibilitychange', onVisibilityChange, true);
  var getFirstHiddenTime = function getFirstHiddenTime() {
    return firstHiddenTime;
  };
  resetFirstInputPolyfill();

  self.webVitals = {
    firstInputPolyfill: firstInputPolyfill,
    resetFirstInputPolyfill: resetFirstInputPolyfill,
    get firstHiddenTime() {
      return getFirstHiddenTime();
    },
  };
})();


/*globals __DEV__ */

// js-url - see LICENSE file

window.raygunUtilityFactory = function(window, Raygun) {
  var rg = {
    getUuid: function() {
      function _p8(s) {
        var p = (Math.random().toString(16) + '000000000').substr(2, 8);
        return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
      }

      return _p8() + _p8(true) + _p8(true) + _p8();
    },

    createCookie: function(name, value, hours, setAsSecure) {
      if (this.isReactNative()) {
        return;
      }

      var expires;
      if (hours) {
        var date = new Date();
        date.setTime(date.getTime() + hours * 60 * 60 * 1000);
        expires = '; expires=' + date.toGMTString();
      } else {
        expires = '';
      }

      var secure = setAsSecure ? '; secure' : '';

      document.cookie = name + '=' + value + expires + '; path=/' + secure;
    },

    readCookie: function(name) {
      if (this.isReactNative()) {
        return 'none';
      }

      var nameEQ = name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }

      return null;
    },

    clearCookie: function(key) {
      if (this.isReactNative()) {
        return;
      }

      this.createCookie(key, '', -1);
    },

    log: function(message, data) {
      if (Raygun.Options._debugMode && window.console && window.console.log) {
        window.console.log(message);

        if (data) {
          window.console.log(data);
        }
      }
    },

    isApiKeyConfigured: function() {
      if (Raygun.Options._raygunApiKey && Raygun.Options._raygunApiKey !== '') {
        return true;
      }
      Raygun.Utilities.log(
        'Raygun API key has not been configured.'
      );
      return false;
    },

    isReactNative: function() {
      return typeof document === 'undefined' && typeof __DEV__ !== 'undefined';
    },

    defaultReactNativeGlobalHandler: function(error, fatal) {
      if (typeof _defaultReactNativeGlobalHandler === 'function') {
        _defaultReactNativeGlobalHandler(error, fatal);
      }
    },

    localStorageAvailable: function() {
      try {
        return 'localStorage' in window && window['localStorage'] !== null;
      } catch (e) {
        return false;
      }
    },

    sessionStorageAvailable: function() {
      try {
        return 'sessionStorage' in window && window['sessionStorage'] !== null;
      } catch(e) {
        return false;
      }
    },

    truncateURL: function(url) {
      // truncate after fourth /, or 24 characters, whichever is shorter
      // /api/1/diagrams/xyz/server becomes
      // /api/1/diagrams/...
      var truncated = url;
      var path = url.split('//')[1];

      if (path) {
        var queryStart = path.indexOf('?');
        var sanitizedPath = path.toString().substring(0, queryStart);
        var truncated_parts = sanitizedPath
          .split('/')
          .slice(0, 4)
          .join('/');
        var truncated_length = sanitizedPath.substring(0, 48);
        truncated =
          truncated_parts.length < truncated_length.length ? truncated_parts : truncated_length;
        if (truncated !== sanitizedPath) {
          truncated += '..';
        }
      }

      return truncated;
    },

    merge: function(o1, o2) {
      var a,
        o3 = {};
      for (a in o1) {
        o3[a] = o1[a];
      }
      for (a in o2) {
        o3[a] = o2[a];
      }
      return o3;
    },

    mergeMutate: function(o1, o2) {
      var a;

      for (a in o2) {
        o1[a] = o2[a];
      }

      return o1;
    },

    mergeArray: function(t0, t1) {
      if (t1 != null) {
        return t0.concat(t1);
      }
      return t0.slice(0);
    },

    forEach: function(set, func) {
      for (var i = 0; i < set.length; i++) {
        func.call(null, i, set[i]);
      }
    },

    isEmpty: function(o) {
      for (var p in o) {
        if (o.hasOwnProperty(p)) {
          return false;
        }
      }
      return true;
    },

    contains: function(array, obj) {
      var i = array.length;
      while (i--) {
        if (array[i] === obj) {
          return true;
        }
      }
      return false;
    },

    getRandomInt: function() {
      return Math.floor(Math.random() * 9007199254740993);
    },

    getViewPort: function() {
      if (this.isReactNative()) {
        return { width: 'Not available', height: 'Not available' };
      }

      var e = document.documentElement,
        g = document.getElementsByTagName('body')[0],
        x = window.innerWidth || e.clientWidth || g.clientWidth,
        y = window.innerHeight || e.clientHeight || g.clientHeight;
      return { width: x, height: y };
    },

    parseUrl: function(arg, url) {
      function isNumeric(arg) {
        return !isNaN(parseFloat(arg)) && isFinite(arg);
      }

      return (function(arg, url) {
        if (typeof document === 'undefined') {
          return '';
        }

        var _ls = url || window.location.toString();

        if (!arg) {
          return _ls;
        } else {
          arg = arg.toString();
        }

        if (_ls.substring(0, 2) === '//') {
          _ls = 'http:' + _ls;
        } else if (_ls.split('://').length === 1) {
          _ls = 'http://' + _ls;
        }

        url = _ls.split('/');
        var _l = { auth: '' },
          host = url[2].split('@');

        if (host.length === 1) {
          host = host[0].split(':');
        } else {
          _l.auth = host[0];
          host = host[1].split(':');
        }

        _l.protocol = url[0];
        _l.hostname = host[0];
        _l.port = host[1] || (_l.protocol.split(':')[0].toLowerCase() === 'https' ? '443' : '80');
        _l.pathname =
          (url.length > 3 ? '/' : '') +
          url
            .slice(3, url.length)
            .join('/')
            .split('?')[0]
            .split('#')[0];
        var _p = _l.pathname;

        if (_p.charAt(_p.length - 1) === '/') {
          _p = _p.substring(0, _p.length - 1);
        }
        var _h = _l.hostname,
          _hs = _h.split('.'),
          _ps = _p.split('/');

        if (arg === 'hostname') {
          return _h;
        } else if (arg === 'domain') {
          if (
            /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(
              _h
            )
          ) {
            return _h;
          }
          return _hs.slice(-2).join('.');
        }
        //else if (arg === 'tld') { return _hs.slice(-1).join('.'); }
        else if (arg === 'sub') {
          return _hs.slice(0, _hs.length - 2).join('.');
        } else if (arg === 'port') {
          return _l.port;
        } else if (arg === 'protocol') {
          return _l.protocol.split(':')[0];
        } else if (arg === 'auth') {
          return _l.auth;
        } else if (arg === 'user') {
          return _l.auth.split(':')[0];
        } else if (arg === 'pass') {
          return _l.auth.split(':')[1] || '';
        } else if (arg === 'path') {
          return _l.pathname;
        } else if (arg.charAt(0) === '.') {
          arg = arg.substring(1);
          if (isNumeric(arg)) {
            arg = parseInt(arg, 10);
            return _hs[arg < 0 ? _hs.length + arg : arg - 1] || '';
          }
        } else if (isNumeric(arg)) {
          arg = parseInt(arg, 10);
          return _ps[arg < 0 ? _ps.length + arg : arg] || '';
        } else if (arg === 'file') {
          return _ps.slice(-1)[0];
        } else if (arg === 'filename') {
          return _ps.slice(-1)[0].split('.')[0];
        } else if (arg === 'fileext') {
          return _ps.slice(-1)[0].split('.')[1] || '';
        } else if (arg.charAt(0) === '?' || arg.charAt(0) === '#') {
          var params = _ls,
            param = null;

          if (arg.charAt(0) === '?') {
            params = (params.split('?')[1] || '').split('#')[0];
          } else if (arg.charAt(0) === '#') {
            params = params.split('#')[1] || '';
          }

          if (!arg.charAt(1)) {
            return params;
          }

          arg = arg.substring(1);
          params = params.split('&');

          for (var i = 0, ii = params.length; i < ii; i++) {
            param = params[i].split('=');
            if (param[0] === arg) {
              return param[1] || '';
            }
          }

          return null;
        }

        return '';
      })(arg, url);
    },
    // Replace existing function on object with new, but call old one afterwards still
    // Returns function that when called will un-enhance object
    enhance: function(object, property, newFunction) {
      var existingFunction = object[property];

      object[property] = function enhanced() {
        newFunction.apply(this, arguments);

        if (typeof existingFunction === 'function') {
          existingFunction.apply(this, arguments);
        }
      };

      return function unenhance() {
        object[property] = existingFunction;
      };
    },
    // Theoretically cross browser event listening
    // Returns function that when called will remove handler
    addEventHandler: function(element, event, handler, useCapture) {
      var capture = useCapture || false;

      if (element.addEventListener) {
        element.addEventListener(event, handler, capture);
      } else if (element.attachEvent) {
        element.attachEvent('on' + event, handler);
      } else {
        element['on' + event] = handler;
      }

      return function() {
        if (element.removeEventListener) {
          element.removeEventListener(event, handler, capture);
        } else if (element.detachEvent) {
          element.detachEvent('on' + event, handler);
        } else {
          element['on' + event] = function() {};
        }
      };
    },
    nodeText: function(node) {
      var text = node.textContent || node.innerText || '';

      if (['submit', 'button'].indexOf(node.type) !== -1) {
        text = node.value || text;
      }

      text = text.replace(/^\s+|\s+$/g, '');

      return text;
    },
    // Returns simple CSS selector to target node
    nodeSelector: function(node) {
      var parts = [node.tagName];

      if (node.id) {
        parts.push('#' + node.id);
      }

      if (node.className && node.className.length) {
        parts.push('.' + node.className.split(' ').join('.'));
      }

      return parts.join('');
    },
    truncate: function(text, length) {
      var omission = '(...)';

      if (text.length > length) {
        return text.slice(0, length - omission.length) + omission;
      } else {
        return text;
      }
    },
    getOrigin: function() {
      if (!window.location.origin) {
        return window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
      }

      return window.location.origin;
    },
    resolveFullUrl: function(url) {
      if(url && url.indexOf('//') === 0) {
        url = window.location.protocol + url;
      }

      if (url && window.location.pathname && url.indexOf('://') === -1) {
        var origin = this.getOrigin();

        if (url.indexOf('/') !== 0) {
          var pathname = window.location.pathname;
          var pathComponents = pathname.split('/');
          pathComponents.pop();

          return origin + pathComponents.join('/') + '/' + url;
        } else {
          return origin + url;
        }
      }

      return url;
    },
    removeFromArray: function(array, item) {
      var newArray = [];

      for (var i = 0; i < array.length; i++) {
        if (array[i] !== item) {
          newArray.push(array[i]);
        }
      }

      return newArray;
    },
    isIE: function() {
      return window.navigator.userAgent.indexOf('Trident') > -1 || window.navigator.userAgent.indexOf('MSIE') > -1;
    }
  };

  var _defaultReactNativeGlobalHandler;
  if (
    rg.isReactNative() &&
    __DEV__ !== true &&
    window.ErrorUtils &&
    window.ErrorUtils.getGlobalHandler
  ) {
    _defaultReactNativeGlobalHandler = window.ErrorUtils.getGlobalHandler();
  }

  return rg;
};

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2017 MindscapeHQ
 * Licensed under the MIT license.
 */

window.raygunNetworkTrackingFactory = function(window, Raygun) {
  var NetworkTracking = function() {
    this.requestHandlers = [];
    this.responseHandlers = [];
    this.errorHandlers = [];

    this.wrapWithHandler = function(method) {
      return function() {
        try {
          return method.apply(this, arguments);
        } catch (ex) {
          Raygun.Utilities.log(ex);
        }
      };
    };

    this.executeHandlers = this.wrapWithHandler(function(handlers, data) {
      for (var i = 0; i < handlers.length; i++) {
        handlers[i](JSON.parse(JSON.stringify(data)));
      }
    });

    this.wrapPrototypeWithHandlers();

    this.attach();
  };

  NetworkTracking.prototype.on = function(type, handler) {
    switch (type) {
      case 'request':
        this.requestHandlers.push(handler);
        break;
      case 'response':
        this.responseHandlers.push(handler);
        break;
      case 'error':
        this.errorHandlers.push(handler);
        break;
    }
  };

  NetworkTracking.prototype.off = function(type, handler) {
    switch (type) {
      case 'request':
        this.requestHandlers = Raygun.Utilities.removeFromArray(this.requestHandlers, handler);
        break;
      case 'response':
        this.responseHandlers = Raygun.Utilities.removeFromArray(this.responseHandlers, handler);
        break;
      case 'error':
        this.errorHandlers = Raygun.Utilities.removeFromArray(this.errorHandlers, handler);
        break;
    }
  };

  NetworkTracking.prototype.attach = function() {
    var self = this;

    if (window.XMLHttpRequest.prototype.addEventListener) {
      Raygun.Utilities.enhance(
        window.XMLHttpRequest.prototype,
        'open',
        self.wrapWithHandler(function() {
          var initTime = new Date().getTime();
          var url = Raygun.Utilities.resolveFullUrl(arguments[1]) || 'Unknown';
          var baseUrl = url.split('?')[0];
          var method = arguments[0];

          Raygun.Utilities.enhance(
            this,
            'send',
            self.wrapWithHandler(function() {
              var metadata = {
                method: method,
                requestURL: url,
                baseUrl: baseUrl,
              };

              if (arguments[0] && typeof arguments[0] === 'string') {
                metadata.body = arguments[0];
              }

              self.executeHandlers(self.requestHandlers, metadata);
            })
          );

          this.addEventListener(
            'load',
            self.wrapWithHandler(function() {
              var body = 'N/A for non text responses';

              if (this.responseType === '' || this.responseType === 'text') {
                body = this.responseText;
              }

              Raygun.Utilities.log('Tracking XHR response for', url);
              self.executeHandlers(self.responseHandlers, {
                status: this.status,
                requestURL: url,
                responseURL: this.responseURL,
                baseUrl: baseUrl,
                body: body,
                duration: new Date().getTime() - initTime,
              });
            })
          );

          this.addEventListener(
            'error',
            self.wrapWithHandler(function() {
              self.executeHandlers(self.errorHandlers, {
                requestURL: url,
                responseURL: this.responseURL,
                duration: new Date().getTime() - initTime,
              });
            })
          );
        })
      );
    }

    var disableFetchLogging = function() {};

    /**
     * Two window objects can be defined inside the installation code snippets that users inject into their page when using Raygun4JS.
     * These are used to intercept the original fetch method before a reference to it can be made.
     * Because if a stored reference to the fetch method is made, we cannot get the status code from that point onwards.
     *
     * window.__raygunOriginalFetch - the window.fetch method as of when the code snippet was executed
     * window.__raygunFetchCallback - a callback which is executed when the code snippet fetch method is called
     */
    var originalFetch = window.__raygunOriginalFetch || window.fetch;

    // If fetch has been polyfilled we don't want to hook into it as it then uses XMLHttpRequest
    // This results in doubled up breadcrumbs
    // Can't reliably detect when it has been polyfilled but no IE version supports fetch
    // So if this is IE, don't hook into fetch
    if (typeof originalFetch === 'function' && typeof originalFetch.polyfill === 'undefined' && !Raygun.Utilities.isIE()) {


      var processFetch = function() {
        var fetchInput = arguments[0];
        var url, baseUrl;
        var options = arguments[1];
        var method = (options && options.method) || 'GET';
        var initTime = new Date().getTime();

        if (typeof fetchInput === 'string') {
          url = fetchInput;
        } else if (typeof window.Request !== 'undefined' && fetchInput instanceof window.Request) {
          url = fetchInput.url;

          if (fetchInput.method) {
            method = fetchInput.method;
          }
        } else {
          url = String(fetchInput);
        }
        url = Raygun.Utilities.resolveFullUrl(url);
        baseUrl = url.split('?')[0];

        var promise = originalFetch.apply(null, arguments);

        try {
          var metadata = {
            method: method,
            requestURL: url,
            baseUrl: baseUrl,
          };

          if (options && options.body) {
            metadata.body = options.body;
          }

          self.executeHandlers(self.requestHandlers, metadata);

          promise.then(
            self.wrapWithHandler(function(response) {
              var body = 'N/A when the fetch response does not support clone()';
              var ourResponse = typeof response.clone === 'function' ? response.clone() : undefined;

              function executeHandlers() {
                Raygun.Utilities.log('tracking fetch response for', url);
                self.executeHandlers(self.responseHandlers, {
                  status: response.status,
                  requestURL: url,
                  responseURL: response.url,
                  body: body,
                  baseUrl: baseUrl,
                  duration: new Date().getTime() - initTime,
                });
              }

              if (ourResponse) {
                try {
                  ourResponse.text().then(function(text) {
                    body = Raygun.Utilities.truncate(text, 500);

                    executeHandlers();
                  }).catch(function() { executeHandlers(); });
                } catch(_e) {
                  executeHandlers();
                }
              } else {
                executeHandlers();
              }
            })
          );

          promise.catch(
            self.wrapWithHandler(function(error) {
              self.executeHandlers(self.errorHandlers, {
                metadata: {
                  requestUrl: url,
                  error: error.toString(),
                  duration: new Date().getTime() - initTime,
                },
              });
            })
          );
        } catch (e) {
          Raygun.Utilities.log(e);
        }

        return promise;
      };

      if(!!window.__raygunOriginalFetch) {
        window.__raygunFetchCallback = processFetch;
      } else {
        window.fetch = processFetch;
      }

      disableFetchLogging = function() {
        window.fetch = originalFetch;
        delete window.__raygunFetchCallback;
      };
    }
  };

  NetworkTracking.prototype.wrapPrototypeWithHandlers = function() {
    var name, method;
    for (name in NetworkTracking.prototype) {
      method = NetworkTracking.prototype[name];
      if (typeof method === 'function') {
        NetworkTracking.prototype[name] = this.wrapWithHandler(method);
      }
    }
  };

  return new NetworkTracking();
};

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2017 MindscapeHQ
 * Licensed under the MIT license.
 */
/* globals console */

window.raygunBreadcrumbsFactory = function(window, Raygun) {
  function urlMatchesIgnoredHosts(url, ignoredHosts) {
    for (var i = 0; i < ignoredHosts.length; i++) {
      var host = ignoredHosts[i];

      if (typeof host === 'string' && url && url.indexOf(host) > -1) {
        return true;
      } else if (typeof host === 'object' && host.exec(url)) {
        return true;
      }
    }

    return false;
  }

  var Breadcrumbs = function() {
    this.MAX_BREADCRUMBS = 32;
    this.MAX_MESSAGE_SIZE = 1024;
    this.BREADCRUMB_LEVELS = ['debug', 'info', 'warning', 'error'];
    this.DEFAULT_BREADCRUMB_LEVEL = 'info';
    this.DEFAULT_XHR_IGNORED_HOSTS = ['raygun'];

    this.breadcrumbLevel = 'info';
    this.logXhrContents = false;
    this.xhrIgnoredHosts = [].concat(this.DEFAULT_XHR_IGNORED_HOSTS);
    this.breadcrumbs = [];
    this.wrapWithHandler = function(method) {
      return function() {
        try {
          return method.apply(this, arguments);
        } catch (ex) {
          Raygun.Utilities.log(ex);
        }
      };
    };

    this.disableConsoleFunctions = [];
    this.disableNavigationFunctions = [];
    this.disableXHRLogging = function() {};
    this.disableClicksTracking = function() {};

    this.enableAutoBreadcrumbs();
    this.wrapPrototypeWithHandlers();
  };

  Breadcrumbs.prototype.recordBreadcrumb = function(value, metadata) {
    var crumb = {
      level: this.DEFAULT_BREADCRUMB_LEVEL,
      timestamp: new Date().getTime(),
      type: 'manual',
    };

    switch (typeof value) {
      case 'object':
        crumb = Raygun.Utilities.merge(crumb, value);
        break;
      case 'string':
        crumb = Raygun.Utilities.merge(
          Raygun.Utilities.merge(crumb, {
            message: value,
            metadata: metadata,
          })
        );
        break;
      default:
        Raygun.Utilities.log(
          "expected first argument to recordBreadcrumb to be a 'string' or 'object', got " +
            typeof value
        );
        return;
    }

    if (this.BREADCRUMB_LEVELS.indexOf(crumb.level) === -1) {
      Raygun.Utilities.log(
        'unknown breadcrumb level ' +
          crumb.level +
          " setting to default of '" +
          this.DEFAULT_BREADCRUMB_LEVEL +
          "'"
      );
      crumb.level = this.DEFAULT_BREADCRUMB_LEVEL;
    }

    if (this.shouldRecord(crumb)) {
      crumb.message = Raygun.Utilities.truncate(crumb.message, this.MAX_MESSAGE_SIZE);

      this.breadcrumbs.push(crumb);
      this.breadcrumbs = this.breadcrumbs.slice(-this.MAX_BREADCRUMBS);
    }
  };

  Breadcrumbs.prototype.shouldRecord = function(crumb) {
    var crumbLevel = this.BREADCRUMB_LEVELS.indexOf(crumb.level);
    var activeLevel = this.BREADCRUMB_LEVELS.indexOf(this.breadcrumbLevel);

    return crumbLevel >= activeLevel;
  };

  Breadcrumbs.prototype.setBreadcrumbLevel = function(level) {
    if (this.BREADCRUMB_LEVELS.indexOf(level) === -1) {
      Raygun.Utilities.log(
        "Breadcrumb level of '" +
          level +
          "' is invalid, setting to default of '" +
          this.DEFAULT_BREADCRUMB_LEVEL +
          "'"
      );

      return;
    }

    this.breadcrumbLevel = level;
  };

  Breadcrumbs.prototype.setOption = function(option, value) {
    if (option === 'breadcrumbsLevel') {
      this.setBreadcrumbLevel(value);
    } else if (option === 'xhrIgnoredHosts') {
      this.xhrIgnoredHosts = value.concat(this.DEFAULT_XHR_IGNORED_HOSTS);

      var self = this;
      this.removeBreadcrumbsWithPredicate(function(crumb) {
        if (crumb.type !== 'request') {
          return false;
        }

        return urlMatchesIgnoredHosts(
          crumb.metadata.requestURL || crumb.metadata.responseURL,
          self.xhrIgnoredHosts
        );
      });
    } else if (option === 'logXhrContents') {
      this.logXhrContents = value;
    }
  };

  Breadcrumbs.prototype.any = function() {
    return this.breadcrumbs.length > 0;
  };

  Breadcrumbs.prototype.all = function() {
    var sanitizedBreadcrumbs = [];

    for (var i = 0; i < this.breadcrumbs.length; i++) {
      var crumb = this.breadcrumbs[i];

      if (crumb && crumb.type === 'request' && !this.logXhrContents) {
        if (crumb.metadata && crumb.metadata.body) {
          crumb.metadata.body = 'Disabled because logContentsOfXhrCalls has not been enabled';
        }
      }

      sanitizedBreadcrumbs.push(crumb);
    }

    return sanitizedBreadcrumbs;
  };

  Breadcrumbs.prototype.enableAutoBreadcrumbs = function() {
    this.enableAutoBreadcrumbsXHR();
    this.enableAutoBreadcrumbsClicks();
    this.enableAutoBreadcrumbsConsole();
    this.enableAutoBreadcrumbsNavigation();
  };

  Breadcrumbs.prototype.disableAutoBreadcrumbs = function() {
    this.disableAutoBreadcrumbsXHR();
    this.disableAutoBreadcrumbsClicks();
    this.disableAutoBreadcrumbsConsole();
    this.disableAutoBreadcrumbsNavigation();
  };

  Breadcrumbs.prototype.removeBreadcrumbsWithPredicate = function(predicate) {
    var crumbs = this.breadcrumbs;
    var filteredCrumbs = [];

    for (var i = 0; i < crumbs.length; i++) {
      var crumb = crumbs[i];

      if (!predicate(crumb)) {
        filteredCrumbs.push(crumb);
      }
    }

    this.breadcrumbs = filteredCrumbs;
  };

  Breadcrumbs.prototype.removeCrumbsOfType = function(type) {
    this.removeBreadcrumbsWithPredicate(function(crumb) {
      return crumb.type === type;
    });
  };

  Breadcrumbs.prototype.enableAutoBreadcrumbsConsole = function() {
    if (typeof window.console === 'undefined') {
      return;
    }

    var logConsoleCall = function logConsoleCall(severity, args) {
      var stringifiedArgs = [];

      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (arg === null || arg === undefined) {
          continue;
        }

        stringifiedArgs.push(arg.toString());
      }

      this.recordBreadcrumb({
        type: 'console',
        level: severity,
        message: Array.prototype.slice.call(stringifiedArgs).join(', '),
      });
    }.bind(this);

    var consoleProperties = ['log', 'warn', 'error'];
    var self = this;
    this.disableConsoleFunctions = consoleProperties.map(function(property) {
      return Raygun.Utilities.enhance(
        console,
        property,
        self.wrapWithHandler(function() {
          var severity = property === 'log' ? 'info' : property === 'warn' ? 'warning' : 'error';

          logConsoleCall(severity, arguments);
        })
      );
    });
  };

  Breadcrumbs.prototype.disableAutoBreadcrumbsConsole = function() {
    this.disableConsoleFunctions.forEach(function(unenhance) {
      unenhance();
    });
    this.removeCrumbsOfType('console');
  };

  Breadcrumbs.prototype.enableAutoBreadcrumbsNavigation = function() {
    if (!window.addEventListener || !window.history || !window.history.pushState) {
      return;
    }

    var buildStateChange = function(name, state, title, url) {
      var currentPath = location.pathname + location.search + location.hash;
      var prevState = null;

      if (window.history.state) {
        prevState = history.state;
      }

      return {
        message: 'History ' + name,
        type: 'navigation',
        level: 'info',
        metadata: {
          from: currentPath,
          to: url || currentPath,
          prevState: JSON.stringify(prevState) || 'unsupported',
          nextState: JSON.stringify(state),
        },
      };
    }.bind(this);

    var parseHash = function(url) {
      return url.split('#')[1] || '';
    };

    var historyFunctionsToEnhance = ['pushState', 'replaceState'];
    this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
      historyFunctionsToEnhance.map(
        function(stateChange) {
          return Raygun.Utilities.enhance(
            history,
            stateChange,
            this.wrapWithHandler(
              function(state, title, url) {
                this.recordBreadcrumb(buildStateChange(stateChange, state, title, url));
              }.bind(this)
            )
          );
        }.bind(this)
      )
    );

    var buildHashChange = function(e) {
      var oldURL = e.oldURL;
      var newURL = e.newURL;
      var metadata;

      if (oldURL && newURL) {
        metadata = {
          from: parseHash(oldURL),
          to: parseHash(newURL),
        };
      } else {
        metadata = {
          to: location.hash,
        };
      }

      return {
        type: 'navigation',
        message: 'Hash change',
        metadata: metadata,
      };
    };

    var logBreadcrumbWrapper = function(handler) {
      return this.wrapWithHandler(
        function() {
          this.recordBreadcrumb(handler.apply(null, arguments));
        }.bind(this)
      );
    }.bind(this);
    var eventsWithHandlers = [
      { element: window, event: 'hashchange', handler: buildHashChange },
      {
        element: window,
        event: 'load',
        handler: function() {
          return { type: 'navigation', message: 'Page loaded' };
        },
      },
      {
        element: window,
        event: 'popstate',
        handler: function() {
          return { type: 'navigation', message: 'Navigated back' };
        },
      },
      {
        element: window,
        event: 'pagehide',
        handler: function() {
          return { type: 'navigation', message: 'Page hidden' };
        },
      },
      {
        element: window,
        event: 'pageshow',
        handler: function() {
          return { type: 'navigation', message: 'Page shown' };
        },
      },
      {
        element: document,
        event: 'DOMContentLoaded',
        handler: function() {
          return { type: 'navigation', message: 'DOMContentLoaded' };
        },
      },
    ];

    this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
      eventsWithHandlers.map(
        function(mapping) {
          return Raygun.Utilities.addEventHandler(
            mapping.element,
            mapping.event,
            logBreadcrumbWrapper(mapping.handler)
          );
        }.bind(this)
      )
    );
  };

  Breadcrumbs.prototype.disableAutoBreadcrumbsNavigation = function() {
    this.disableNavigationFunctions.forEach(function(unenhance) {
      unenhance();
    });
    this.disableNavigationFunctions = [];

    this.removeCrumbsOfType('navigation');
  };

  Breadcrumbs.prototype.enableAutoBreadcrumbsClicks = function() {
    this.disableClicksTracking = Raygun.Utilities.addEventHandler(
      window,
      'click',
      this.wrapWithHandler(
        function(e) {
          var text, selector;

          try {
            text = Raygun.Utilities.truncate(Raygun.Utilities.nodeText(e.target), 150);
            selector = Raygun.Utilities.nodeSelector(e.target);
          } catch (exception) {
            text = '[unknown]';
            selector = '[unknown]';

            Raygun.Utilities.log(
              'Error retrieving node text/selector. Most likely due to a cross domain error'
            );
          }

          this.recordBreadcrumb({
            type: 'click-event',
            message: 'UI Click',
            level: 'info',
            metadata: {
              text: text,
              selector: selector,
            },
          });
        }.bind(this),
        true
      )
    );
  };

  Breadcrumbs.prototype.disableAutoBreadcrumbsClicks = function() {
    this.disableClicksTracking();
    this.removeCrumbsOfType('click-event');
  };

  Breadcrumbs.prototype.enableAutoBreadcrumbsXHR = function() {
    var self = this;

    var requestHandler = self.wrapWithHandler(function(request) {
      if (urlMatchesIgnoredHosts(request.requestURL, self.xhrIgnoredHosts)) {
        return;
      }

      if (request.body) {
        request.body = Raygun.Utilities.truncate(request.body, 500);
      }

      self.recordBreadcrumb({
        type: 'request',
        message: 'Opening request to ' + request.requestURL,
        level: 'info',
        metadata: request,
      });
    });
    var responseHandler = self.wrapWithHandler(function(response) {
      if (
        urlMatchesIgnoredHosts(response.requestURL, self.xhrIgnoredHosts) ||
        urlMatchesIgnoredHosts(response.responseURL, self.xhrIgnoredHosts)
      ) {
        return;
      }

      if (response.body) {
        response.body = Raygun.Utilities.truncate(response.body, 500);
      }

      response.duration = response.duration + 'ms';
      self.recordBreadcrumb({
        type: 'request',
        message: 'Finished request to ' + response.requestURL,
        level: 'info',
        metadata: response,
      });
    });
    var errorHandler = self.wrapWithHandler(function(error) {
      if (urlMatchesIgnoredHosts(error.requestURL, self.xhrIgnoredHosts)) {
        return;
      }

      error.duration = error.duration + 'ms';
      self.recordBreadcrumb({
        type: 'request',
        message: 'Failed request to ' + error.requestUrl,
        level: 'info',
        metadata: error,
      });
    });

    Raygun.NetworkTracking.on('request', requestHandler);
    Raygun.NetworkTracking.on('response', responseHandler);
    Raygun.NetworkTracking.on('error', errorHandler);

    this.disableXHRLogging = function() {
      Raygun.NetworkTracking.off('request', requestHandler);
      Raygun.NetworkTracking.off('response', responseHandler);
      Raygun.NetworkTracking.off('error', errorHandler);
    };
  };

  Breadcrumbs.prototype.disableAutoBreadcrumbsXHR = function() {
    this.disableXHRLogging();
    this.removeCrumbsOfType('request');
  };

  Breadcrumbs.prototype.wrapPrototypeWithHandlers = function() {
    var name, method;
    for (name in Breadcrumbs.prototype) {
      method = Breadcrumbs.prototype[name];
      if (typeof method === 'function') {
        Breadcrumbs.prototype[name] = this.wrapWithHandler(method);
      }
    }
  };

  return Breadcrumbs;
};

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2021 MindscapeHQ
 * Licensed under the MIT license.
 */


function raygunCoreWebVitalFactory(window) {
    var WebVitalTimingType = "w";
    var queueTimings = null;

    var CoreWebVitals = function(){
        this.cleanWebVitalData = function (event) {
            var res = event;

            if(res.value && res.value.toFixed) {
                res.value = res.value.toFixed(3);
            }

            return res;
        };
    };

    CoreWebVitals.prototype.attach = function(queueHandler) {
        queueTimings = queueHandler;

        if(typeof window !== 'undefined' && window.webVitals) {
            if(window.webVitals.getLCP) {
                window.webVitals.getLCP(this.handler);
            }

            if(window.webVitals.getFID) {
                window.webVitals.getFID(this.handler);
            }

            if(window.webVitals.getCLS) {
                window.webVitals.getCLS(this.handler);
            }
        }
    };

    CoreWebVitals.prototype.handler = function(event) {
        if(event.value && event.value.toFixed) {
            event.value = event.value.toFixed(3);
        }

        var webVitalEvent = {
            url: event.name,
            timing: {
                t: WebVitalTimingType,
                du: event.value
            }
        };

        queueTimings(webVitalEvent);
    };

    return new CoreWebVitals();
}

window.raygunCoreWebVitalFactory = raygunCoreWebVitalFactory;
/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2013-2018 Raygun Limited
 * Licensed under the MIT license.
 */

/*globals __DEV__, raygunUtilityFactory, raygunBreadcrumbsFactory, raygunNetworkTrackingFactory, raygunCoreWebVitalFactory */

var raygunFactory = function(window, $, undefined) {
  var Raygun = {};
  Raygun.Utilities = raygunUtilityFactory(window, Raygun);
  Raygun.NetworkTracking = raygunNetworkTrackingFactory(window, Raygun);
  Raygun.Breadcrumbs = raygunBreadcrumbsFactory(window, Raygun);
  Raygun.CoreWebVitals = raygunCoreWebVitalFactory(window);

  // Constants
  /*** REMOVED
   var ProviderStates = {
    LOADING: 0,
    READY: 1,
  }; ***/

  var _userKey = 'raygun4js-userid';

  // State variables
  var _traceKit = TraceKit,
    _raygun = window.Raygun,
    _debugMode = false,
    _allowInsecureSubmissions = false,
    _ignoreAjaxAbort = false,
    _ignoreAjaxError = false,
    _enableOfflineSave = false,
    _ignore3rdPartyErrors = false,
    _disableAnonymousUserTracking = false,
    _disableErrorTracking = false,
    _disablePulse = true,
    _wrapAsynchronousCallbacks = false,
    _automaticPerformanceCustomTimings = false,
    _trackCoreWebVitals = true,
    _customData = {},
    _tags = [],
    _user,
    _version,
    _filteredKeys,
    _whitelistedScriptDomains = [],
    _beforeSendCallback,
    _beforeSendRumCallback,
    _groupingKeyCallback,
    _beforeXHRCallback,
    _afterSendCallback,
    _raygunApiUrl = 'https://api.raygun.io',
    _excludedHostnames = null,
    _excludedUserAgents = null,
    _filterScope = 'customData',
    _rum = null,
    _breadcrumbs = new Raygun.Breadcrumbs(),
    _pulseMaxVirtualPageDuration = null,
    _pulseIgnoreUrlCasing = true,
    //_providerState = ProviderStates.LOADING,  // REMOVED
    _loadedFrom,
    _processExceptionQueue = [],
    _trackEventQueue = [],
    _pulseCustomLoadTimeEnabled = null,
    $document,
    _captureUnhandledRejections = true,
    _setCookieAsSecure = false,
    _clientIp,
    _captureMissingRequests = false,
    detachPromiseRejectionFunction;

  var rand = Math.random();
  var _publicRaygunFunctions = {
    Rand: rand,
    Options: {},

    noConflict: function() {
      // Because _raygun potentially gets set before other code sets window.Raygun
      // this will potentially overwrite the new Raygun object with undefined
      // Not really much point in restoring undefined so just don't do that
      if (_raygun) {
        window.Raygun = _raygun;
      }
      return Raygun;
    },

    constructNewRaygun: function() {
      var rgInstance = raygunFactory(window, window.jQuery);

      return rgInstance;
    },

    init: function(key, options, customdata) {
      _traceKit.remoteFetching = false;

      this.Options._raygunApiKey = key;

      if (customdata) {
        _customData = customdata;
      }

      if ($) {
        $document = $(document);
      }

      if (options) {
        _allowInsecureSubmissions = options.allowInsecureSubmissions || false;
        _ignoreAjaxAbort = options.ignoreAjaxAbort || false;
        _ignoreAjaxError = options.ignoreAjaxError || false;
        _disableAnonymousUserTracking = options.disableAnonymousUserTracking || false;
        _disableErrorTracking = options.disableErrorTracking || false;
        _disablePulse = options.disablePulse === undefined ? true : options.disablePulse;
        _excludedHostnames = options.excludedHostnames || false;
        _excludedUserAgents = options.excludedUserAgents || false;
        _pulseMaxVirtualPageDuration = options.pulseMaxVirtualPageDuration || null;
        _pulseIgnoreUrlCasing = options.pulseIgnoreUrlCasing || false;
        _pulseCustomLoadTimeEnabled = options.pulseCustomLoadTimeEnabled || false;
        _setCookieAsSecure = options.setCookieAsSecure || false;
        _captureMissingRequests = options.captureMissingRequests || false;
        _automaticPerformanceCustomTimings = options.automaticPerformanceCustomTimings || false;
        _trackCoreWebVitals = options.trackCoreWebVitals === undefined ? true : options.trackCoreWebVitals;

        if (options.apiUrl) {
          _raygunApiUrl = options.apiUrl;
        }

        if (typeof options.wrapAsynchronousCallbacks !== 'undefined') {
          _wrapAsynchronousCallbacks = options.wrapAsynchronousCallbacks;
        }

        if (typeof options.captureUnhandledRejections !== 'undefined') {
          _captureUnhandledRejections = options.captureUnhandledRejections;
        }

        if (options.debugMode) {
          _debugMode = options.debugMode;
        }
        this.Options._debugMode = _debugMode;

        if (options.ignore3rdPartyErrors) {
          _ignore3rdPartyErrors = true;
        }

        if (options.apiEndpoint) {
          _raygunApiUrl = options.apiEndpoint;
        }

        if (options.from) {
          _loadedFrom = options.from;
        }

        if(options.clientIp) {
          _clientIp = options.clientIp;
        }
      }

      ensureUser();

      return Raygun;
    },

    withCustomData: function(customdata) {
      _customData = customdata;
      return Raygun;
    },

    withTags: function(tags) {
      _tags = tags;

      if (_rum !== undefined && _rum !== null) {
        _rum.withTags(tags);
      }

      return Raygun;
    },

    attach: function() {
      if (!Raygun.Utilities.isApiKeyConfigured() || _disableErrorTracking) {
        return Raygun;
      }

      if (window.RaygunObject && window[window.RaygunObject] && window[window.RaygunObject].q) {
        window.onerror = null;
      }

      if (_captureUnhandledRejections) {
        attachPromiseRejectionHandler();
      }

      // Attach React Native's handler in Release mode
      if (Raygun.Utilities.isReactNative()) {
        if (__DEV__ !== true && window.ErrorUtils && window.ErrorUtils.setGlobalHandler) {
          window.ErrorUtils.setGlobalHandler(function(error, fatal) {
            // Calling the defaultReactNativeGlobalHandler in release mode instantly closes the application
            // If an exception is currently being sent it will be lost, this sets our own afterSendCallback
            // to notify us when the error is done sending so we can call the default handler
            var originalAfterSendCallback = _afterSendCallback;
            _afterSendCallback = function() {
              if (typeof originalAfterSendCallback === 'function') {
                originalAfterSendCallback();
              }

              Raygun.Utilities.defaultReactNativeGlobalHandler(error, fatal);
              _afterSendCallback = originalAfterSendCallback;
            };

            TraceKit.report(error);
          });
        }
      }

      _traceKit.report.subscribe(processException);

      if (_wrapAsynchronousCallbacks) {
        _traceKit.extendToAsynchronousCallbacks();
      }

      if ($document && $document.ajaxError && !_ignoreAjaxError) {
        $document.ajaxError(processJQueryAjaxError);
      }

      return Raygun;
    },

    detach: function() {
      _traceKit.report.unsubscribe(processException);
      if ($document) {
        $document.unbind('ajaxError', processJQueryAjaxError);
      }
      if (_captureUnhandledRejections) {
        detachPromiseRejectionHandler();
      }
      return Raygun;
    },

    //*** REPLACE??
    send: function(ex, customData, tags) {
      if (_disableErrorTracking) {
        Raygun.Utilities.log('Error not sent due to disabled error tracking');
        return Raygun;
      }

      try {
        processException(
          _traceKit.computeStackTrace(ex),
          {
            customData:
              typeof _customData === 'function'
                ? Raygun.Utilities.merge(_customData(), customData)
                : Raygun.Utilities.merge(_customData, customData),
            tags:
              typeof _tags === 'function'
                ? Raygun.Utilities.mergeArray(_tags(), tags)
                : Raygun.Utilities.mergeArray(_tags, tags),
          },
          true,
          ex
        );
      } catch (traceKitException) {
        if (ex !== traceKitException) {
          throw traceKitException;
        }
      }
      return Raygun;
    }, //***/

    setUser: function(user, isAnonymous, email, fullName, firstName, uuid) {
      _user = {
        Identifier: user,
      };
      if (typeof isAnonymous === 'boolean') {
        _user['IsAnonymous'] = isAnonymous;
      }
      if (email) {
        _user['Email'] = email;
      }
      if (fullName) {
        _user['FullName'] = fullName;
      }
      if (firstName) {
        _user['FirstName'] = firstName;
      }
      if (uuid) {
        _user['UUID'] = uuid;
      }

      if (_rum !== undefined && _rum !== null) {
        _rum.setUser(_user);
      }

      return Raygun;
    },

    resetAnonymousUser: function() {
      clearStorage();
    },

    setVersion: function(version) {
      _version = version;
      return Raygun;
    },

    saveIfOffline: function(enableOffline) {
      if (typeof enableOffline !== 'undefined' && typeof enableOffline === 'boolean') {
        _enableOfflineSave = enableOffline;
      }

      return Raygun;
    },

    filterSensitiveData: function(filteredKeys) {
      _filteredKeys = filteredKeys;
      return Raygun;
    },

    setFilterScope: function(scope) {
      if (scope === 'customData' || scope === 'all') {
        _filterScope = scope;
      }
      return Raygun;
    },

    whitelistCrossOriginDomains: function(whitelist) {
      _whitelistedScriptDomains = whitelist;
      return Raygun;
    },

    onBeforeSend: function(callback) {
      _beforeSendCallback = callback;
      return Raygun;
    },

    onBeforeSendRum: function(callback) {
      _beforeSendRumCallback = callback;
      return Raygun;
    },

    groupingKey: function(callback) {
      _groupingKeyCallback = callback;
      return Raygun;
    },

    onBeforeXHR: function(callback) {
      _beforeXHRCallback = callback;
      return Raygun;
    },

    onAfterSend: function(callback) {
      _afterSendCallback = callback;
      return Raygun;
    },

    // Public Pulse functions

    endSession: function() {
      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        _rum.endSession();
      }
    },

    trackEvent: function(type, options) {
      /*** REMOVED if (_providerState !== ProviderStates.READY) {
        _trackEventQueue.push({ type: type, options: options });
        return;
      }***/

      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        if (type === 'pageView' && options.path) {
          _rum.virtualPageLoaded(options.path);
        } else if (type === 'customTiming') {
          _rum.trackCustomTiming(options.name, options.duration, options.offset);
        } else if (type === 'customTimings' && options.timings) {
          _rum.sendCustomTimings(options.timings);
        }
      }
    },

    setClientIp: function(ip) {
      _clientIp = ip;
    },
    captureMissingRequests: function(val) {
      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        _rum.captureMissingRequests(val);
      }
    },
    recordBreadcrumb: function() {
      _breadcrumbs.recordBreadcrumb.apply(_breadcrumbs, arguments);
    },
    enableAutoBreadcrumbs: function(type) {
      if (type) {
        _breadcrumbs['enableAutoBreadcrumbs' + type]();
      } else {
        _breadcrumbs.enableAutoBreadcrumbs();
      }
    },
    disableAutoBreadcrumbs: function(type) {
      if (type) {
        _breadcrumbs['disableAutoBreadcrumbs' + type]();
      } else {
        _breadcrumbs.disableAutoBreadcrumbs();
      }
    },
    setBreadcrumbOption: function(option, value) {
      _breadcrumbs.setOption(option, value);
    },
    setBreadcrumbs: function(breadcrumbs) {
      _breadcrumbs = breadcrumbs;
    },
    getBreadcrumbs: function() {
      return _breadcrumbs.all();
    },
  };

  Raygun = Raygun.Utilities.mergeMutate(Raygun, _publicRaygunFunctions);

  function callAfterSend(response) {
    if (typeof _afterSendCallback === 'function') {
      _afterSendCallback(response);
    }
  }

  function ensureUser() {
    if (!_user && !_disableAnonymousUserTracking) {
      getFromStorage(setUserComplete);
    } else {
      bootRaygun();
    }
  }

  function setUserComplete(userId) {
    var userIdentifier = "Unknown";

    if (!userId) {
      userIdentifier = Raygun.Utilities.getUuid();
      saveToStorage(userIdentifier);
    } else {
      userIdentifier = userId;
    }

    Raygun.setUser(userIdentifier, true, null, null, null, userIdentifier);

    bootRaygun();
  }

  // Callback for `unhandledrejection` event.
  function promiseRejectionHandler(event) {
    var error = event.reason;
    if (!error && event.detail && event.detail.reason) {
      error = event.detail.reason;
    }
    if (!(error instanceof Error) && event.reason && event.reason.error) {
      error = event.reason.error;
    }
    if (!error) {
      error = new Error('Unhandled promise rejection');
      // Clear the stacktrace, as we don't want the error to appear to come from raygun4js
      error.stack = null;
    }

    _publicRaygunFunctions.send(error, null, ['UnhandledPromiseRejection']);
  }

  // Install global promise rejection handler.
  function attachPromiseRejectionHandler() {
    detachPromiseRejectionFunction = Raygun.Utilities.addEventHandler(
      window,
      'unhandledrejection',
      promiseRejectionHandler
    );
  }

  // Uninstall global promise rejection handler.
  function detachPromiseRejectionHandler() {
    if (detachPromiseRejectionFunction) {
      detachPromiseRejectionFunction();
    }
  }

  // The final initializing logic is provided as a callback due to async storage methods for user data in React Native
  // The common case executes it immediately due to that data being provided by the cookie synchronously
  // The case when Affected User Tracking is enabled calls this function when the code sets the user data
  let bootRaygunCalled = false;
  function bootRaygun() {
    /*** REMOVED if (_providerState === ProviderStates.READY) {
      return;
    }

    _providerState = ProviderStates.READY;
    ***/
    (!bootRaygunCalled) || fail("'bootRaygun' called twice - what's up?");
    bootRaygunCalled = true;

    if (Raygun.RealUserMonitoring !== undefined && !_disablePulse) {
      var startRum = function() {
        _rum = new Raygun.RealUserMonitoring(
          Raygun.Options._raygunApiKey,
          _raygunApiUrl,
          makePostCorsRequest,
          _user,
          _version,
          _tags,
          _excludedHostnames,
          _excludedUserAgents,
          _debugMode,
          _pulseMaxVirtualPageDuration,
          _pulseIgnoreUrlCasing,
          _pulseCustomLoadTimeEnabled,
          _beforeSendRumCallback,
          _setCookieAsSecure,
          _captureMissingRequests,
          _automaticPerformanceCustomTimings,
          _trackCoreWebVitals
        );
        _rum.attach();
      };

      if (!Raygun.Utilities.isReactNative()) {
        if (_loadedFrom === 'onLoad') {
          startRum();
        } else {
          if (window.addEventListener) {
            window.addEventListener('load', startRum);
          } else {
            window.attachEvent('onload', startRum);
          }
        }
      } else {
        Raygun.Utilities.log('Not enabling RUM because Raygun4JS has detected a React Native environment, see #310 on Github');
      }
    }

    retriggerDelayedCommands();

    sendSavedErrors();
  }

  // We need to delay handled/unhandled send() and trackEvent() calls until the user data callback has returned
  function retriggerDelayedCommands() {
    var i;
    for (i = 0; i < _processExceptionQueue.length; i++) {
      processException(
        _processExceptionQueue[i].stackTrace,
        _processExceptionQueue[i].options,
        _processExceptionQueue[i].userTriggered,
        _processExceptionQueue[i].error
      );
    }

    _processExceptionQueue = [];

    for (i = 0; i < _trackEventQueue.length; i++) {
      _publicRaygunFunctions.trackEvent(_trackEventQueue[i].type, _trackEventQueue[i].options);
    }

    _trackEventQueue = [];
  }

  /*** not used
  function offlineSave(url, data) {
    var dateTime = new Date().toJSON();

    try {
      var key =
        'raygunjs+' +
        Raygun.Options._raygunApiKey +
        '=' +
        dateTime +
        '=' +
        Raygun.Utilities.getRandomInt();

      if (typeof localStorage[key] === 'undefined') {
        localStorage[key] = JSON.stringify({ url: url, data: data });
      }
    } catch (e) {
      Raygun.Utilities.log('Raygun4JS: LocalStorage full, cannot save exception');
    }
  }***/

  function sendSavedErrors() {
    if (Raygun.Utilities.localStorageAvailable()) {
      for (var key in localStorage) {
        if (key.indexOf('raygunjs+' + Raygun.Options._raygunApiKey) > -1) {
          try {
            var payload = JSON.parse(localStorage[key]);
            makePostCorsRequest(payload.url, payload.data);
          } catch (e) {
            Raygun.Utilities.log('Raygun4JS: Invalid JSON object in LocalStorage');
          }

          try {
            localStorage.removeItem(key);
          } catch (e) {
            Raygun.Utilities.log('Raygun4JS: Unable to remove error');
          }
        }
      }
    }
  }

  function filterValue(key, value) {
    if (_filteredKeys) {
      for (var i = 0; i < _filteredKeys.length; i++) {
        if (typeof _filteredKeys[i] === 'object' && typeof _filteredKeys[i].exec === 'function') {
          var executedFilter = _filteredKeys[i].exec(key);

          if (executedFilter !== null && executedFilter !== undefined) {
            return '[removed by filter]';
          }
        } else if (_filteredKeys[i] === key) {
          return '[removed by filter]';
        }
      }
    }

    return value;
  }

  /*** not used
  function filterObject(reference, parentKey) {
    if (reference == null) {
      return reference;
    }

    if (Object.prototype.toString.call(reference) !== '[object Object]') {
      return reference;
    }

    var filteredObject = {};

    for (var propertyName in reference) {
      var propertyValue = reference[propertyName];

      if (Object.prototype.toString.call(propertyValue) === '[object Object]') {
        if (parentKey !== 'Details' || propertyName !== 'Client') {
          filteredObject[propertyName] = filterObject(
            filterValue(propertyName, propertyValue),
            propertyName
          );
        } else {
          filteredObject[propertyName] = propertyValue;
        }
      } else if (Object.prototype.toString.call(propertyValue) !== '[object Function]') {
        if (typeof parentKey !== 'undefined') {
          filteredObject[propertyName] = filterValue(propertyName, propertyValue);
        } else if (propertyName === 'OccurredOn') {
          filteredObject[propertyName] = propertyValue;
        }
      }
    }

    return filteredObject;
  }***/

  function processJQueryAjaxError(event, jqXHR, ajaxSettings, thrownError) {
    var message =
      'AJAX Error: ' +
      (jqXHR.statusText || 'unknown') +
      ' ' +
      (ajaxSettings.type || 'unknown') +
      ' ' +
      (Raygun.Utilities.truncateURL(ajaxSettings.url) || 'unknown');

    // ignore ajax abort if set in the options
    if (_ignoreAjaxAbort) {
      if (jqXHR.status === 0 || !jqXHR.getAllResponseHeaders()) {
        return;
      }
    }

    Raygun.send(thrownError || event.type, {
      status: jqXHR.status,
      statusText: jqXHR.statusText,
      type: ajaxSettings.type,
      url: ajaxSettings.url,
      ajaxErrorMessage: message,
      contentType: ajaxSettings.contentType,
      requestData:
        ajaxSettings.data && ajaxSettings.data.slice
          ? ajaxSettings.data.slice(0, 10240)
          : undefined,
      responseData:
        jqXHR.responseText && jqXHR.responseText.slice
          ? jqXHR.responseText.slice(0, 10240)
          : undefined,
      activeTarget:
        event.target &&
        event.target.activeElement &&
        event.target.activeElement.outerHTML &&
        event.target.activeElement.outerHTML.slice
          ? event.target.activeElement.outerHTML.slice(0, 10240)
          : undefined,
    });
  }

  /*** REPLACE
  function processException(stackTrace, options, userTriggered, error) {
    if (_providerState !== ProviderStates.READY) {
      _processExceptionQueue.push({
        stackTrace: stackTrace,
        options: options,
        userTriggered: userTriggered,
        error: error,
      });
      return;
    }

    var scriptError = 'Script error';

    var stack = [],
      qs = {};

    if (_ignore3rdPartyErrors) {
      if (!stackTrace.stack || !stackTrace.stack.length) {
        Raygun.Utilities.log('Raygun4JS: Cancelling send due to null stacktrace');
        return;
      }

      var domain = Raygun.Utilities.parseUrl('domain');

      var msg = scriptError;
      if (stackTrace.message) {
        msg = stackTrace.message;
      } else if (options && options.status) {
        msg = options.status;
      }

      if (typeof msg === 'undefined') {
        msg = scriptError;
      }

      if (
        !Raygun.Utilities.isReactNative() &&
        typeof msg.substring === 'function' &&
        msg.substring(0, scriptError.length) === scriptError &&
        stackTrace.stack[0].url !== null &&
        stackTrace.stack[0].url !== undefined &&
        stackTrace.stack[0].url.indexOf(domain) === -1 &&
        (stackTrace.stack[0].line === 0 || stackTrace.stack[0].func === '?')
      ) {
        Raygun.Utilities.log(
          'Raygun4JS: cancelling send due to third-party script error with no stacktrace and message'
        );
        return;
      }

      var foundValidDomain = false;
      for (var i = 0; !foundValidDomain && stackTrace.stack && i < stackTrace.stack.length; i++) {
        if (
          stackTrace.stack[i] !== null &&
          stackTrace.stack[i] !== undefined &&
          stackTrace.stack[i].url !== null &&
          stackTrace.stack[i].url !== undefined
        ) {
          for (var j in _whitelistedScriptDomains) {
            if (stackTrace.stack[i].url.indexOf(_whitelistedScriptDomains[j]) > -1) {
              foundValidDomain = true;
            }
          }

          if (stackTrace.stack[i].url.indexOf(domain) > -1) {
            foundValidDomain = true;
          }
        }
      }

      if (!foundValidDomain) {
        Raygun.Utilities.log(
          'Raygun4JS: cancelling send due to error on non-origin, non-whitelisted domain'
        );

        return;
      }
    }

    if (_excludedHostnames instanceof Array) {
      for (var hostIndex in _excludedHostnames) {
        if (_excludedHostnames.hasOwnProperty(hostIndex)) {
          if (
            window.location.hostname &&
            window.location.hostname.match(_excludedHostnames[hostIndex])
          ) {
            Raygun.Utilities.log(
              'Raygun4JS: cancelling send as error originates from an excluded hostname'
            );

            return;
          }
        }
      }
    }

    if (_excludedUserAgents instanceof Array && !Raygun.Utilities.isReactNative()) {
      for (var userAgentIndex in _excludedUserAgents) {
        if (_excludedUserAgents.hasOwnProperty(userAgentIndex)) {
          if (navigator.userAgent.match(_excludedUserAgents[userAgentIndex])) {
            Raygun.Utilities.log(
              'Raygun4JS: cancelling send as error originates from an excluded user agent'
            );

            return;
          }
        }
      }
    }

    if (
      !Raygun.Utilities.isReactNative() &&
      navigator.userAgent.match('RaygunPulseInsightsCrawler')
    ) {
      return;
    }

    if (stackTrace.stack && stackTrace.stack.length) {
      Raygun.Utilities.forEach(stackTrace.stack, function(i, frame) {
        stack.push({
          LineNumber: frame.line,
          ColumnNumber: frame.column,
          ClassName: 'line ' + frame.line + ', column ' + frame.column,
          FileName: frame.url,
          MethodName: frame.func || '[anonymous]',
        });
      });
    }

    var queryString = Raygun.Utilities.parseUrl('?');

    if (queryString.length > 0) {
      Raygun.Utilities.forEach(queryString.split('&'), function(i, segment) {
        var parts = segment.split('=');
        if (parts && parts.length === 2) {
          var key = decodeURIComponent(parts[0]);
          var value = filterValue(key, parts[1]);

          qs[key] = value;
        }
      });
    }

    if (options === undefined) {
      options = {};
    }

    if (Raygun.Utilities.isEmpty(options.customData)) {
      if (typeof _customData === 'function') {
        options.customData = _customData();
      } else {
        options.customData = _customData;
      }
    }

    if (Raygun.Utilities.isEmpty(options.tags)) {
      if (typeof _tags === 'function') {
        options.tags = _tags();
      } else if (typeof _tags === 'string') {
        options.tags = [_tags];
      } else {
        options.tags = _tags;
      }
    }

    if (!userTriggered) {
      if (!options.tags) {
        options.tags = [];
      }

      if (!Raygun.Utilities.contains(options.tags, 'UnhandledException')) {
        options.tags.push('UnhandledException');
      }
    }

    if (
      Raygun.Utilities.isReactNative() &&
      !Raygun.Utilities.contains(options.tags, 'React Native')
    ) {
      options.tags.push('React Native');
    }

    var screenData = window.screen || {
      width: Raygun.Utilities.getViewPort().width,
      height: Raygun.Utilities.getViewPort().height,
      colorDepth: 8,
    };

    var custom_message = options.customData && options.customData.ajaxErrorMessage;

    var finalCustomData;
    if (_filterScope === 'customData') {
      finalCustomData = filterObject(options.customData, 'UserCustomData');
    } else {
      finalCustomData = options.customData;
    }

    try {
      JSON.stringify(finalCustomData);
    } catch (e) {
      var m = 'Cannot add custom data; may contain circular reference';
      finalCustomData = { error: m };
      Raygun.Utilities.log('Raygun4JS: ' + m);
    }

    var finalMessage = scriptError;
    if (custom_message) {
      finalMessage = custom_message;
    } else if (stackTrace.message) {
      finalMessage = stackTrace.message;
    } else if (options && options.status) {
      finalMessage = options.status;
    } else if (typeof error === 'string') {
      finalMessage = error;
    }

    if (typeof finalMessage === 'undefined') {
      finalMessage = scriptError;
    }

    if (finalMessage && typeof finalMessage === 'string') {
      finalMessage = finalMessage.substring(0, 512);
    }

    var pageLocation;
    if (!Raygun.Utilities.isReactNative()) {
      pageLocation = [
        location.protocol,
        '//',
        location.host,
        location.pathname,
        location.hash,
      ].join('');
    } else {
      pageLocation = '/';
    }

    var payload = {
      OccurredOn: new Date(),
      Details: {
        Error: {
          ClassName: stackTrace.name,
          Message: finalMessage,
          StackTrace: stack,
          StackString: stackTrace.stackstring,
        },
        Environment: {
          UtcOffset: new Date().getTimezoneOffset() / -60.0,
          'User-Language': navigator.userLanguage,
          'Document-Mode': !Raygun.Utilities.isReactNative()
            ? document.documentMode
            : 'Not available',
          'Browser-Width': Raygun.Utilities.getViewPort().width,
          'Browser-Height': Raygun.Utilities.getViewPort().height,
          'Screen-Width': screenData.width,
          'Screen-Height': screenData.height,
          'Color-Depth': screenData.colorDepth,
          Browser: navigator.appCodeName,
          'Browser-Name': navigator.appName,
          'Browser-Version': navigator.appVersion,
          Platform: navigator.platform,
        },
        Client: {
          Name: 'raygun-js',
          Version: '2.22.5',
        },
        UserCustomData: finalCustomData,
        Tags: options.tags,
        Request: {
          Url: pageLocation,
          QueryString: qs,
          Headers: {
            'User-Agent': navigator.userAgent,
            Referer: !Raygun.Utilities.isReactNative() ? document.referrer : 'Not available',
            Host: !Raygun.Utilities.isReactNative() ? document.domain : 'Not available',
          },
        },
        Version: _version || 'Not supplied',
      },
    };

    payload.Details.User = _user;

    if (_breadcrumbs.any()) {
      payload.Details.Breadcrumbs = [];
      var crumbs = _breadcrumbs.all() || [];

      crumbs.forEach(function(crumb) {
        if (crumb.metadata) {
          crumb.CustomData = crumb.metadata;
          delete crumb.metadata;
        }

        payload.Details.Breadcrumbs.push(crumb);
      });
    }

    if (_filterScope === 'all') {
      payload = filterObject(payload);
    }

    if (typeof _groupingKeyCallback === 'function') {
      Raygun.Utilities.log('Raygun4JS: calling custom grouping key');
      payload.Details.GroupingKey = _groupingKeyCallback(payload, stackTrace, options);
    }

    if (typeof _beforeSendCallback === 'function') {
      var mutatedPayload = _beforeSendCallback(payload);

      if (mutatedPayload) {
        sendToRaygun(mutatedPayload);
      }
    } else {
      sendToRaygun(payload);
    }
  }
  ***/

  /*** (only used by 'ProcessException()')
  function sendToRaygun(data) {
    if (!Raygun.Utilities.isApiKeyConfigured()) {
      return;
    }

    Raygun.Utilities.log('Sending exception data to Raygun:', data);
    var url = _raygunApiUrl + '/entries?apikey=' + encodeURIComponent(Raygun.Options._raygunApiKey);
    makePostCorsRequest(url, JSON.stringify(data));
  }
  ***/

  /*** 'makePostCorsRequest' REPLACED
  // Create the XHR object.
  function createCORSRequest(method, url) {
    var xhr;

    xhr = new window.XMLHttpRequest();

    if ('withCredentials' in xhr || Raygun.Utilities.isReactNative()) {
      // XHR for Chrome/Firefox/Opera/Safari
      // as well as React Native's custom XHR implementation
      xhr.open(method, url, true);
    } else if (window.XDomainRequest) {
      // XDomainRequest for IE.
      if (_allowInsecureSubmissions) {
        // remove 'https:' and use relative protocol
        // this allows IE8 to post messages when running
        // on http
        url = url.slice(6);
      }

      xhr = new window.XDomainRequest();
      xhr.open(method, url);
    }

    xhr.timeout = 10000;

    return xhr;
  }

  // Make the actual CORS request.
  function makePostCorsRequest(url, data, _successCallback, _errorCallback) {
    var xhr = createCORSRequest('POST', url, data);
    if (typeof xhr.setRequestHeader === 'function') {
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');

      if(typeof _clientIp !== "undefined") {
        xhr.setRequestHeader('X-Remote-Address', _clientIp);
      }
    }

    if (typeof _beforeXHRCallback === 'function') {
      _beforeXHRCallback(xhr);
    }

    Raygun.Utilities.log('Is offline enabled? ' + _enableOfflineSave);

    // For some reason this check is false in React Native but these handlers still need to be attached
    if ('withCredentials' in xhr || Raygun.Utilities.isReactNative()) {
      xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) {
          return;
        }

        if (xhr.status === 202) {
          sendSavedErrors();
        } else if (
          _enableOfflineSave &&
          xhr.status !== 403 &&
          xhr.status !== 400 &&
          xhr.status !== 429
        ) {
          offlineSave(url, data);
        }
      };

      xhr.onload = function() {
        Raygun.Utilities.log('posted to Raygun');

        callAfterSend(this);

        if (_successCallback && typeof _successCallback === 'function') {
          _successCallback(xhr, url, data);
        }
      };
    } else if (window.XDomainRequest) {
      xhr.ontimeout = function() {
        if (_enableOfflineSave) {
          Raygun.Utilities.log('Raygun: saved locally');
          offlineSave(url, data);
        }
      };

      xhr.onload = function() {
        Raygun.Utilities.log('posted to Raygun');

        sendSavedErrors();
        callAfterSend(this);

        if (_successCallback && typeof _successCallback === 'function') {
          _successCallback(xhr, url, data);
        }
      };
    }

    xhr.onerror = function() {
      Raygun.Utilities.log('failed to post to Raygun');

      callAfterSend(this);

      if (_errorCallback && typeof _errorCallback === 'function') {
        _errorCallback(xhr, url, data);
      }
    };

    if (!xhr) {
      Raygun.Utilities.log('CORS not supported');
      return;
    }

    // Old versions of RN fail to send errors without this
    if (Raygun.Utilities.isReactNative()) {
      xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    }

    xhr.send(data);
  }
  ***/

  // Storage
  function saveToStorage(value) {
    localStorage.setItem(_userKey, value);
  }

  function clearStorage() {
    localStorage.removeItem(_userKey);
  }

  function getFromStorage(callback) {
    /**
     * Attempt to get the value from local storage,
     * If that doesn't contain a value then try from a cookie as previous versions saved it here
     */
    const value = localStorage.getItem(_userKey);
    callback(value);
  }

  if (!window.__raygunNoConflict) {
    window.Raygun = Raygun;
  }
  TraceKit.setRaygun(Raygun);

  return Raygun;
};

window.__instantiatedRaygun = raygunFactory(window, window.jQuery);

(function() {

  // Raygun: This ensures that we do not initialize Core Web Vitals for non-browser environments
  if (typeof document === 'undefined') {
    return;
  }

  var generateUniqueID = function generateUniqueID() {
    return 'v2-'.concat(Date.now(), '-').concat(Math.floor(Math.random() * (9e12 - 1)) + 1e12);
  };
  var initMetric = function initMetric(name, value) {
    return {
      name: name,
      value: typeof value === 'undefined' ? -1 : value,
      delta: 0,
      entries: [],
      id: generateUniqueID(),
    };
  };
  var observe = function observe(type, callback) {
    try {
      if (PerformanceObserver.supportedEntryTypes.includes(type)) {
        if (type === 'first-input' && !('PerformanceEventTiming' in self)) {
          return;
        }
        var po = new PerformanceObserver((function(l) {
          return l.getEntries().map(callback);
        }));
        po.observe({ type: type, buffered: true });
        return po;
      }
    } catch (e) {
    }
    return;
  };
  var onHidden = function onHidden(cb, once) {
    var onHiddenOrPageHide = function onHiddenOrPageHide(event) {
      if (event.type === 'pagehide' || document.visibilityState === 'hidden') {
        cb(event);
        if (once) {
          removeEventListener('visibilitychange', onHiddenOrPageHide, true);
          removeEventListener('pagehide', onHiddenOrPageHide, true);
        }
      }
    };
    addEventListener('visibilitychange', onHiddenOrPageHide, true);
    addEventListener('pagehide', onHiddenOrPageHide, true);
  };
  var onBFCacheRestore = function onBFCacheRestore(cb) {
    addEventListener('pageshow', (function(event) {
      if (event.persisted) {
        cb(event);
      }
    }), true);
  };
  var bindReporter = function bindReporter(callback, metric, reportAllChanges) {
    var prevValue;
    return function(forceReport) {
      if (metric.value >= 0) {
        if (forceReport || reportAllChanges) {
          metric.delta = metric.value - (prevValue || 0);
          if (metric.delta || prevValue === undefined) {
            prevValue = metric.value;
            callback(metric);
          }
        }
      }
    };
  };
  var firstHiddenTime = -1;
  var initHiddenTime = function initHiddenTime() {
    return document.visibilityState === 'hidden' ? 0 : Infinity;
  };
  var trackChanges = function trackChanges() {
    onHidden((function(_ref) {
      var timeStamp = _ref.timeStamp;
      firstHiddenTime = timeStamp;
    }), true);
  };
  var getVisibilityWatcher = function getVisibilityWatcher() {
    if (firstHiddenTime < 0) {
      {
        firstHiddenTime = self.webVitals.firstHiddenTime;
        if (firstHiddenTime === Infinity) {
          trackChanges();
        }
      }
      onBFCacheRestore((function() {
        setTimeout((function() {
          firstHiddenTime = initHiddenTime();
          trackChanges();
        }), 0);
      }));
    }
    return {
      get firstHiddenTime() {
        return firstHiddenTime;
      },
    };
  };
  var getFCP = function getFCP(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('FCP');
    var report;
    var entryHandler = function entryHandler(entry) {
      if (entry.name === 'first-contentful-paint') {
        if (po) {
          po.disconnect();
        }
        if (entry.startTime < visibilityWatcher.firstHiddenTime) {
          metric.value = entry.startTime;
          metric.entries.push(entry);
          report(true);
        }
      }
    };
    var fcpEntry = performance.getEntriesByName && performance.getEntriesByName('first-contentful-paint')[0];
    var po = fcpEntry ? null : observe('paint', entryHandler);
    if (fcpEntry || po) {
      report = bindReporter(onReport, metric, reportAllChanges);
      if (fcpEntry) {
        entryHandler(fcpEntry);
      }
      onBFCacheRestore((function(event) {
        metric = initMetric('FCP');
        report = bindReporter(onReport, metric, reportAllChanges);
        requestAnimationFrame((function() {
          requestAnimationFrame((function() {
            metric.value = performance.now() - event.timeStamp;
            report(true);
          }));
        }));
      }));
    }
  };
  var isMonitoringFCP = false;
  var fcpValue = -1;
  var getCLS = function getCLS(onReport, reportAllChanges) {
    if (!isMonitoringFCP) {
      getFCP((function(metric) {
        fcpValue = metric.value;
      }));
      isMonitoringFCP = true;
    }
    var onReportWrapped = function onReportWrapped(arg) {
      if (fcpValue > -1) {
        onReport(arg);
      }
    };
    var metric = initMetric('CLS', 0);
    var report;
    var sessionValue = 0;
    var sessionEntries = [];
    var entryHandler = function entryHandler(entry) {
      if (!entry.hadRecentInput) {
        var firstSessionEntry = sessionEntries[0];
        var lastSessionEntry = sessionEntries[sessionEntries.length - 1];
        if (sessionValue && entry.startTime - lastSessionEntry.startTime < 1e3 && entry.startTime - firstSessionEntry.startTime < 5e3) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }
        if (sessionValue > metric.value) {
          metric.value = sessionValue;
          metric.entries = sessionEntries;
          report();
        }
      }
    };
    var po = observe('layout-shift', entryHandler);
    if (po) {
      report = bindReporter(onReportWrapped, metric, reportAllChanges);
      onHidden((function() {
        po.takeRecords().map(entryHandler);
        report(true);
      }));
      onBFCacheRestore((function() {
        sessionValue = 0;
        fcpValue = -1;
        metric = initMetric('CLS', 0);
        report = bindReporter(onReportWrapped, metric, reportAllChanges);
      }));
    }
  };
  var getFID = function getFID(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('FID');
    var report;
    var entryHandler = function entryHandler(entry) {
      if (entry.startTime < visibilityWatcher.firstHiddenTime) {
        metric.value = entry.processingStart - entry.startTime;
        metric.entries.push(entry);
        report(true);
      }
    };
    var po = observe('first-input', entryHandler);
    report = bindReporter(onReport, metric, reportAllChanges);
    if (po) {
      onHidden((function() {
        po.takeRecords().map(entryHandler);
        po.disconnect();
      }), true);
    }
    {
      if (!po) {
        window.webVitals.firstInputPolyfill(entryHandler);
      }
      onBFCacheRestore((function() {
        metric = initMetric('FID');
        report = bindReporter(onReport, metric, reportAllChanges);
        window.webVitals.resetFirstInputPolyfill();
        window.webVitals.firstInputPolyfill(entryHandler);
      }));
    }
  };
  var reportedMetricIDs = new Set;
  var getLCP = function getLCP(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('LCP');
    var report;
    var entryHandler = function entryHandler(entry) {
      var value = entry.startTime;
      if (value < visibilityWatcher.firstHiddenTime) {
        metric.value = value;
        metric.entries.push(entry);
      }
      report();
    };
    var po = observe('largest-contentful-paint', entryHandler);
    if (po) {
      report = bindReporter(onReport, metric, reportAllChanges);
      var stopListening = function stopListening() {
        if (!reportedMetricIDs.has(metric.id)) {
          po.takeRecords().map(entryHandler);
          po.disconnect();
          reportedMetricIDs.add(metric.id);
          report(true);
        }
      };
      ['keydown', 'click'].forEach((function(type) {
        addEventListener(type, stopListening, { once: true, capture: true });
      }));
      onHidden(stopListening, true);
      onBFCacheRestore((function(event) {
        metric = initMetric('LCP');
        report = bindReporter(onReport, metric, reportAllChanges);
        requestAnimationFrame((function() {
          requestAnimationFrame((function() {
            metric.value = performance.now() - event.timeStamp;
            reportedMetricIDs.add(metric.id);
            report(true);
          }));
        }));
      }));
    }
  };
  var afterLoad = function afterLoad(callback) {
    if (document.readyState === 'complete') {
      setTimeout(callback, 0);
    } else {
      addEventListener('pageshow', callback);
    }
  };
  var getNavigationEntryFromPerformanceTiming = function getNavigationEntryFromPerformanceTiming() {
    var timing = performance.timing;
    var navigationEntry = { entryType: 'navigation', startTime: 0 };
    for (var key in timing) {
      if (key !== 'navigationStart' && key !== 'toJSON') {
        navigationEntry[key] = Math.max(timing[key] - timing.navigationStart, 0);
      }
    }
    return navigationEntry;
  };
  var getTTFB = function getTTFB(onReport) {
    var metric = initMetric('TTFB');
    afterLoad((function() {
      try {
        var navTiming = performance.getEntriesByType('navigation');
        var navigationEntry = !!navTiming ? navTiming[0] : getNavigationEntryFromPerformanceTiming();
        metric.value = metric.delta = navigationEntry.responseStart;
        if (metric.value < 0) return;
        metric.entries = [navigationEntry];
        onReport(metric);
      } catch (error) {
      }
    }));
  };

  window.webVitals.getCLS = getCLS;
  window.webVitals.getFCP = getFCP;
  window.webVitals.getFID = getFID;
  window.webVitals.getLCP = getLCP;
  window.webVitals.getTTFB = getTTFB;
})();



/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2018 MindscapeHQ
 * Licensed under the MIT license.
 */

var raygunRumFactory = function(window, $, Raygun) {
  Raygun.RealUserMonitoring = function(
    apiKey,
    apiUrl,
    makePostCorsRequest,
    user,
    version,
    tags,
    excludedHostNames,
    excludedUserAgents,
    debugMode,
    maxVirtualPageDuration,
    ignoreUrlCasing,
    customTimingsEnabled,
    beforeSendCb,
    setCookieAsSecure,
    captureMissingRequests,
    automaticPerformanceCustomTimings,
    trackCoreWebVitals
  ) {
    var self = this;
    var _private = {};

    this.cookieName = 'raygun4js-sid';
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.debugMode = debugMode;
    this.excludedHostNames = excludedHostNames;
    this.excludedUserAgents = excludedUserAgents;
    this.maxVirtualPageDuration = maxVirtualPageDuration || 1800000; // 30 minutes
    this.ignoreUrlCasing = ignoreUrlCasing;
    /**
     * Note: the `customTimingsEnabled` flag is for tracking legacy custom timings
     * because that api prevents page timings from being sent until the main request is completed
     */
    this.customTimingsEnabled = customTimingsEnabled;
    this.automaticPerformanceCustomTimings = automaticPerformanceCustomTimings;

    this.trackCoreWebVitals = trackCoreWebVitals;

    this.beforeSend =
      beforeSendCb ||
      function(payload) {
        return payload;
      };

    this.pendingPayloadData = customTimingsEnabled || false;
    this.queuedPerformanceTimings = [];
    this.pendingVirtualPage = null;

    this.sessionId = null;
    this.virtualPage = null;
    this.user = user;
    this.version = version;
    this.tags = tags;
    this.heartBeatInterval = null;
    this.heartBeatIntervalTime = 30000;
    this.offset = 0;
    this._captureMissingRequests = captureMissingRequests || false;
    this.sendUsingNavigatorBeacon = false;

    /**
     * `stopCollectingMetrics` is a flag to stop collecting/sending metrics from this point onwards.
     * This is used to prevent resources triggered from the 'pageshow' event from being tracked
     */
    this.stopCollectingMetrics = false;

    this.queuedItems = [];
    this.maxQueueItemsSent = 50;
    this.setCookieAsSecure = setCookieAsSecure;

    this.xhrRequestMap = {};
    this.xhrStatusMap = {};

    var Timings = {
      Page: 'p',
      VirtualPage: 'v',
      XHR: 'x',
      CachedChildAsset: 'e',
      ChildAsset: 'c',
      CustomTiming: 't',
      CoreWebVital: 'w'
    };

    this.Utilities = {};

    // ================================================================================
    // =                                                                              =
    // =                                 Public Api                                   =
    // =                                                                              =
    // ================================================================================

    this.attach = function() {
      if(this.trackCoreWebVitals) {
        Raygun.CoreWebVitals.attach(sendCoreWebVitalTimings);
      }

      getSessionId(function(isNewSession) {
        self.pageLoaded(isNewSession);
      });

      var clickHandler = function() {
        this.updateStorageTimestamp();
      }.bind(_private);

      var unloadHandler = function() {
        self.sendUsingNavigatorBeacon = true;
        sendChildAssets(true);
        sendQueuedItems();
      }.bind(_private);

      var visibilityChangeHandler = function() {
        if (document.visibilityState === 'visible') {
          this.updateStorageTimestamp();
        }
      }.bind(_private);

      var pageHideHandler = function() {
        self.sendUsingNavigatorBeacon = true;
        sendChildAssets(true);
        sendQueuedItems();
        self.stopCollectingMetrics = true;
      }.bind(_private);

      if (window.addEventListener) {
        window.addEventListener('click', clickHandler);
        document.addEventListener('visibilitychange', visibilityChangeHandler);
        window.addEventListener('beforeunload', unloadHandler);
        window.addEventListener('pagehide', pageHideHandler);
      } else if (window.attachEvent) {
        document.attachEvent('onclick', clickHandler);
      }

      Raygun.NetworkTracking.on('request', xhrRequestHandler.bind(this));
      Raygun.NetworkTracking.on('error', xhrErrorHandler.bind(this));
      Raygun.NetworkTracking.on('response', xhrResponseHandler.bind(this));
    };

    this.pageLoaded = function(isNewSession) {
      // Only create a session if we don't have one.
      if (isNewSession) {
        sendNewSessionStart();
      }

      sendPerformance(true);

      heartBeat();

      self.initalStaticPageLoadTimestamp = getPerformanceNow(0);
    };

    this.virtualPageLoaded = function(path) {
      if (typeof path === 'string') {
        if (path.length > 0 && path[0] !== '/') {
          path = path + '/';
        }

        if (path.length > 800) {
          path = path.substring(0, 800);
        }

        this.virtualPage = path;
      }

      resumeCollectingMetrics();
      processVirtualPageTimingsInQueue();
      sendPerformance(false);
    };

    this.setUser = function(user) {
      self.user = user;
    };

    this.withTags = function(tags) {
      self.tags = tags;
    };

    this.endSession = function() {
      self.pendingPayloadData = false;
      sendQueuedPerformancePayloads();

      sendItemImmediately({
        sessionId: self.sessionId,
        requestId: self.requestId,
        timestamp: new Date().toISOString(),
        type: 'session_end',
      });

      generateNewSessionId();

      sendNewSessionStart();
    };

    // Legacy Custom Timings
    this.sendCustomTimings = function(customTimings) {
      if (
        typeof customTimings === 'object' &&
        (typeof customTimings.custom1 === 'number' ||
          typeof customTimings.custom2 === 'number' ||
          typeof customTimings.custom3 === 'number' ||
          typeof customTimings.custom4 === 'number' ||
          typeof customTimings.custom5 === 'number' ||
          typeof customTimings.custom6 === 'number' ||
          typeof customTimings.custom7 === 'number' ||
          typeof customTimings.custom8 === 'number' ||
          typeof customTimings.custom9 === 'number' ||
          typeof customTimings.custom10 === 'number')
      ) {
        if (self.pendingPayloadData && self.queuedPerformanceTimings.length > 0) {
          // Append custom timings to first queued item, which should be a page view
          self.pendingPayloadData = false;
          self.queuedPerformanceTimings[0].customTiming = customTimings;
          sendQueuedPerformancePayloads();
        }
      }
    };

    this.trackCustomTiming = function(name, duration, offset) {
      if(typeof duration === "number") {
        var newTimings = [];
        newTimings.push(createCustomTimingMeasurement(name, duration, offset));
        addPerformanceTimingsToQueue(newTimings, false);
      } else {
        log('Raygun4JS: Custom timing "' + name + '" duration value is not a number');
      }
    };

    this.captureMissingRequests = function(val) {
      this._captureMissingRequests = val;
    };

    // ================================================================================
    // =                                                                              =
    // =                              Session Management                              =
    // =                                                                              =
    // ================================================================================

    function heartBeat() {
      if (self.heartBeatInterval !== null) {
        log('Raygun4JS: Heartbeat already exists. Skipping heartbeat creation.');
        return;
      }

      self.heartBeatInterval = setInterval(function() {
        sendChildAssets();
        sendQueuedItems();

        self.xhrStatusMap = {};
      }, self.heartBeatIntervalTime); // 30 seconds between heartbeats
    }

    function sendNewSessionStart() {
      sendItemImmediately({
        sessionId: self.sessionId,
        timestamp: new Date().toISOString(),
        type: 'session_start',
        user: self.user,
        version: self.version || 'Not supplied',
        tags: self.tags,
        device: navigator.userAgent,
      });
    }

    function hasSessionExpired(storageItem) {
      var existingTimestamp = new Date(readStorageElement(storageItem, 'timestamp'));
      var halfHrAgo = new Date(new Date() - 30 * 60000);
      return existingTimestamp < halfHrAgo;
    }

    function getSessionId(callback) {
      var storageItem = getFromStorage();
      var nullValue = storageItem === null;
      var expired = false;

      if(!nullValue) {
        expired = hasSessionExpired(storageItem);
      }

      if(nullValue || expired) {
        generateNewSessionId();
        callback(true);
      } else {
        var id = readStorageElement(storageItem, 'id');
        saveToStorage(id); // Update the timestamp
        self.sessionId = id;
        callback(false);
      }
    }

    function updateStorageTimestamp() {
      var storageItem = getFromStorage();
      var expired = false;

      if(storageItem) {
        expired = hasSessionExpired(storageItem);
      }

      if(expired || !storageItem){
        self.sessionId = randomKey(32);
      }

      saveToStorage(self.sessionId);

      if (expired) {
        sendNewSessionStart();
      }
    }

    function generateNewSessionId(){
      self.sessionId = randomKey(32);
      saveToStorage(self.sessionId);
    }

    // ================================================================================
    // =                                                                              =
    // =                                  Queueing                                    =
    // =                                                                              =
    // ================================================================================

    function sendPerformance(firstLoad) {
      var performanceData = getPerformanceData(self.virtualPage, firstLoad);

      if (performanceData === null || performanceData.length < 0) {
        return;
      }

      addPerformanceTimingsToQueue(performanceData, false);
    }

    function sendChildAssets(forceSend) {
      if (forceSend) {
        processVirtualPageTimingsInQueue();
      }

      var data = [];
      extractChildData(data, undefined, forceSend);
      addPerformanceTimingsToQueue(data, forceSend);
    }

    function sendQueuedItems() {
      if (self.queuedItems.length > 0) {
        // Dequeue:
        self.queuedItems = sortCollectionByProperty(self.queuedItems, 'timestamp');
        var itemsToSend = self.queuedItems.splice(0, self.maxQueueItemsSent);

        sendItemsImmediately(itemsToSend);
      }
    }

    function processVirtualPageTimingsInQueue() {
      var i = 0,
        data;
      for (i; i < self.queuedPerformanceTimings.length; i++) {
        data = self.queuedPerformanceTimings[i];
        if (data.timing.t === Timings.VirtualPage && data.timing.pending) {
          data.timing = generateVirtualEncodedTimingData(data.timing);
        }
      }
    }

    function sendItemImmediately(item) {
      var itemsToSend = [item];

      sendItemsImmediately(itemsToSend);
    }

    function sendItemsImmediately(itemsToSend) {
      var payload = {
        eventData: itemsToSend,
      };

      var successCallback = function() {
        log('Raygun4JS: Items sent successfully. Queue length: ' + self.queuedItems.length);
      };

      var errorCallback = function(response) {

        // Requeue:
        requeueItemsToFront(itemsToSend);

        log(
          'Raygun4JS: Items failed to send. Queue length: ' +
            self.queuedItems.length +
            ' Response status code: ' +
            response.status
        );
      };

      postPayload(payload, successCallback, errorCallback);
    }

    function sendQueuedPerformancePayloads(forceSend) {
      if (self.pendingPayloadData && !forceSend) {
        return;
      }

      var currentPayloadTimingData = [];
      var payloadTimings = [];
      var payloadIncludesPageTiming = false;
      var data, i;

      var addCurrentPayloadEvents = function() {
        payloadTimings.push(createTimingPayload(currentPayloadTimingData));
        currentPayloadTimingData = [];
        payloadIncludesPageTiming = false;
      };

      var sendTimingData = function() {
        if (currentPayloadTimingData.length > 0) {
          addCurrentPayloadEvents();
        }

        if (payloadTimings.length > 0) {
          sendItemsImmediately(payloadTimings);
          currentPayloadTimingData = [];
          payloadIncludesPageTiming = false;
        }
      };

      for (i = 0; i < self.queuedPerformanceTimings.length; i++) {
        data = self.queuedPerformanceTimings[i];
        var isPageOrVirtualPage =
          data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage;

        if (payloadIncludesPageTiming && isPageOrVirtualPage) {
          // Ensure that pages/virtual pages are both not included in the same 'web_request_timing'
          addCurrentPayloadEvents();
        }

        if (currentPayloadTimingData.length > 0 && isPageOrVirtualPage) {
          // Resources already exist before the page view so associate them with previous "page" by having them as a seperate web_request_timing
          addCurrentPayloadEvents();
        }

        if (isPageOrVirtualPage) {
          // If the next timing data is a page or virtual page, generate a new request ID
          createRequestId();
        }

        if (data.timing.t === Timings.VirtualPage && data.timing.pending) {
          // Pending virtual page, wait until the virtual page timings have been calculated
          sendTimingData();
          self.queuedPerformanceTimings.splice(0, i);
          return;
        }

        currentPayloadTimingData.push(data);
        payloadIncludesPageTiming =
          payloadIncludesPageTiming ||
          (data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage);
      }

      sendTimingData();
      self.queuedPerformanceTimings = [];
    }

    function requeueItemsToFront(itemsToSend) {
      self.queuedItems = itemsToSend.concat(self.queuedItems);
    }

    function addPerformanceTimingsToQueue(performanceData, forceSend) {
      if(self.stopCollectingMetrics === false) {
        self.queuedPerformanceTimings = self.queuedPerformanceTimings.concat(performanceData);
        sendQueuedPerformancePayloads(forceSend);
      }
    }

    function sendCoreWebVitalTimings(performanceData) {
      // Core web vital timing metrics need to be sent to the API immediately, if they are queued then they may not be sent if a virtual page timing event occurs before they are tracked
      sendItemImmediately(createTimingPayload([performanceData]));
    }

    // ================================================================================
    // =                                                                              =
    // =                                Timing Data                                   =
    // =                                                                              =
    // ================================================================================

    function getPerformanceData(virtualPage, firstLoad) {
      if (
        !performanceEntryExists('timing', 'object') ||
        window.performance.timing.fetchStart === undefined ||
        isNaN(window.performance.timing.fetchStart)
      ) {
        return null;
      }

      var data = [];

      if (firstLoad) {
        // Called by the static onLoad event being fired, persist itself
        data.push(getPrimaryTimingData());
      }

      // Called during both the static load event and the virtual load calls
      // Associates all data loaded up to this point with the previous page
      // Eg: Page load if it is this is a new load, or the last view if a virtual page was freshly triggered
      extractChildData(data);

      if (virtualPage) {
        data.push(getVirtualPrimaryTimingData(virtualPage, getPerformanceNow(0)));

        extractChildData(data, true);
      }

      return data;
    }

    function extractChildData(collection, fromVirtualPage, forceSend) {
      if (!performanceEntryExists('getEntries', 'function')) {
        return;
      }

      try {
        var offset = fromVirtualPage ? 0 : window.performance.timing.navigationStart;
        var resources = window.performance.getEntries();
        var i;

        for (i = self.offset; i < resources.length; i++) {
          var resource = resources[i];
          if(!forceSend && waitingForResourceToFinishLoading(resource)) {
            break;
          } else if (isCustomTimingMeasurement(resource)) {
            if(self.automaticPerformanceCustomTimings) {
              collection.push(getCustomTimingMeasurement(resource));
            }
          } else if (!shouldIgnoreResource(resource)) {
            collection.push(getSecondaryTimingData(resource, offset));
          }
        }

        self.offset = i;

        if(this._captureMissingRequests) {
          addMissingWrtData(collection, offset);
        }
      } catch (e) {
        log(e);
      }
    }

    /**
     * This adds in the missing WRT data from non 2xx status code responses in Chrome/Safari
     * This is to ensure we have full status code tracking support.
     * It creates a fake WRT payload containing only the duration & XHR type as those are the minimum
     * required set of fields
     */
    var addMissingWrtData = function(collection, offset) {
      log('checking for missing WRT data', this.xhrStatusMap);

      for (var url in this.xhrStatusMap) {
        if (this.xhrStatusMap.hasOwnProperty(url)) {
          var responses = this.xhrStatusMap[url];

          if (responses && responses.length > 0) {
            do {
              var response = responses.shift();
              log('checking response', response);

              if (!shouldIgnoreResourceByName(response.baseUrl)) {
                log('adding missing WRT data for url');

                collection.push({
                  url: response.baseUrl,
                  statusCode: response.status,
                  timing: {
                    du: maxFiveMinutes(response.duration).toFixed(2),
                    a: offset.toFixed(2),
                    t: Timings.XHR
                  },
                });
              }
            } while (responses.length > 0);
          }

          delete this.xhrStatusMap[url];
        }
      }
    }.bind(this);

    function getPrimaryTimingData() {
      var pathName = window.location.pathname;

      if (self.ignoreUrlCasing) {
        pathName = pathName.toLowerCase();
      }

      var url = window.location.protocol + '//' + window.location.host + pathName;

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return {
        url: url,
        userAgent: navigator.userAgent,
        timing: getEncodedTimingData(),
        size: 0,
      };
    }

    function getVirtualPrimaryTimingData(virtualPage, virtualPageStartTime) {
      if (self.ignoreUrlCasing) {
        virtualPage = virtualPage.toLowerCase();
      }

      if (virtualPage.indexOf('?') !== -1) {
        virtualPage = virtualPage.split('?')[0];
      }

      var url = window.location.protocol + '//' + window.location.host + virtualPage;

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return {
        url: url,
        userAgent: navigator.userAgent,
        timing: prepareVirtualEncodedTimingData(virtualPageStartTime),
        size: 0,
      };
    }

    var getTimingUrl = function(timing) {
      var url = timing.name.split('?')[0];

      if (self.ignoreUrlCasing) {
        url = url.toLowerCase();
      }

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return url;
    }.bind(this);

    /**
     * Stops sending through timing information if a XHR request has been made by the response handler hasn't been fired.
     * This is to prevent issues where multiple timings for the same asset can be sent.
     * Once for the performance timing and another for the missing request (if the captureMissingRequests option is enabled)
     */
    var waitingForResourceToFinishLoading = function(timing) {
      var url = getTimingUrl(timing);
      var request = this.xhrRequestMap[url];

      return request && request.length > 0;
    }.bind(this);

    var getSecondaryTimingData = function(timing, offset) {
      var url = getTimingUrl(timing);

      var timingData = {
        url: url,
        timing: getSecondaryEncodedTimingData(
          timing,
          offset
        ),
        size: timing.decodedBodySize || 0,
      };

      log('retrieving secondary timing data for', timing.name);

      var xhrStatusesForName = this.xhrStatusMap[url];
      if (xhrStatusesForName && xhrStatusesForName.length > 0) {
        timingData.statusCode = this.xhrStatusMap[url].shift().status;

        log('found status for timing', timingData.statusCode);
        if (this.xhrStatusMap[url].length === 0) {
          delete this.xhrStatusMap[url];
        }
      } else {
        log('no status found for timing', this.xhrStatusMap);
      }

      return timingData;
    }.bind(this);

    function getEncodedTimingData() {
      var timing = window.performance.timing;

      var data = {
        du: timing.duration,
        t: Timings.Page,
      };

      data.a = timing.fetchStart;

      if (timing.domainLookupStart && timing.domainLookupStart > 0) {
        data.b = timing.domainLookupStart - data.a;
      }

      if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
        data.c = timing.domainLookupEnd - data.a;
      }

      if (timing.connectStart && timing.connectStart > 0) {
        data.d = timing.connectStart - data.a;
      }

      if (timing.connectEnd && timing.connectEnd > 0) {
        data.e = timing.connectEnd - data.a;
      }

      if (timing.responseStart && timing.responseStart > 0) {
        data.f = timing.responseStart - data.a;
      }

      if (timing.responseEnd && timing.responseEnd > 0) {
        data.g = timing.responseEnd - data.a;
      }

      if (timing.domLoading && timing.domLoading > 0) {
        data.h = timing.domLoading - data.a;
      }

      if (timing.domInteractive && timing.domInteractive > 0) {
        data.i = timing.domInteractive - data.a;
      }

      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventEnd > 0) {
        data.j = timing.domContentLoadedEventEnd - data.a;
      }

      if (timing.domComplete && timing.domComplete > 0) {
        data.k = maxFiveMinutes(timing.domComplete - data.a);
      }

      if (timing.loadEventStart && timing.loadEventStart > 0) {
        data.l = timing.loadEventStart - data.a;
      }

      if (timing.loadEventEnd && timing.loadEventEnd > 0) {
        data.m = timing.loadEventEnd - data.a;
      }

      if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
        data.n = (timing.secureConnectionStart - timing.connectStart) - data.a;
      }

      data = sanitizeNaNs(data);

      data = addPaintTimings(data);

      return data;
    }

    /**
     * Adds first-paint and first-contentful-paint timings onto the main page timing.
     * The performance API is used as it's a more standard method only supported in Chrome.
     * `msFirstPaint` is used for Edge/IE browsers and returns a Unix timestamp. We calculate
     * the difference between 'msFirstPaint' and 'connectStart' to get first-paint for Edge/IE.
     */
    function addPaintTimings(data) {
      if(!performanceEntryExists('getEntriesByName', 'function')) {
        return data;
      }

      var firstPaint = window.performance.getEntriesByName('first-paint');

      if(firstPaint.length > 0 && firstPaint[0].startTime > 0) {
        data.fp = firstPaint[0].startTime.toFixed(2);
      } else if(window.performance.timing && !!window.performance.timing.msFirstPaint) {
        data.fp = (window.performance.timing.msFirstPaint - window.performance.timing.fetchStart).toFixed(2);
      }

      var firstContentfulPaint = window.performance.getEntriesByName('first-contentful-paint');

      if(firstContentfulPaint.length > 0 && firstContentfulPaint[0].startTime > 0) {
        data.fcp = firstContentfulPaint[0].startTime.toFixed(2);
      }

      return data;
    }

    function getSecondaryEncodedTimingData(timing, offset) {
      var data = {
        du: maxFiveMinutes(getTimingDuration(timing)).toFixed(2),
        t: getSecondaryTimingType(timing),
        a: offset + timing.fetchStart,
      };

      if (timing.domainLookupStart && timing.domainLookupStart > 0) {
        data.b = offset + timing.domainLookupStart - data.a;
      }

      if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
        data.c = offset + timing.domainLookupEnd - data.a;
      }

      if (timing.connectStart && timing.connectStart > 0) {
        data.d = offset + timing.connectStart - data.a;
      }

      if (timing.connectEnd && timing.connectEnd > 0) {
        data.e = offset + timing.connectEnd - data.a;
      }

      if (timing.responseStart && timing.responseStart > 0) {
        data.f = offset + timing.responseStart - data.a;
      }

      if (timing.responseEnd && timing.responseEnd > 0) {
        data.g = offset + timing.responseEnd - data.a;
      }

      if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
        data.n = offset + (timing.secureConnectionStart - timing.connectStart) - data.a;
      }

      data.a = data.a.toFixed(2);
      data = sanitizeNaNs(data);

      return data;
    }

    function generateVirtualEncodedTimingData(timingData) {
      var now = getPerformanceNow(0);

      return {
        t: timingData.t,
        du: Math.min(self.maxVirtualPageDuration, now - timingData.startTime),
        o: Math.min(self.maxVirtualPageDuration, now - timingData.staticLoad),
      };
    }

    function prepareVirtualEncodedTimingData(virtualPageStartTime) {
      return {
        t: Timings.VirtualPage,
        startTime: virtualPageStartTime,
        staticLoad: self.initalStaticPageLoadTimestamp,
        pending: true,
      };
    }

    // ================================================================================
    // =                                                                              =
    // =                                Networking                                    =
    // =                                                                              =
    // ================================================================================

    function postPayload(payload, _successCallback, _errorCallback) {
      if (typeof _successCallback !== 'function') {
        _successCallback = function() {};
      }

      if (typeof _errorCallback !== 'function') {
        _errorCallback = function() {};
      }

      makePostCorsRequestRum(
        self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey),
        payload,
        _successCallback,
        _errorCallback
      );
    }

    function makePostCorsRequestRum(url, data, successCallback, errorCallback) {
      if (self.excludedUserAgents instanceof Array) {
        for (var userAgentIndex in self.excludedUserAgents) {
          if (self.excludedUserAgents.hasOwnProperty(userAgentIndex)) {
            if (navigator.userAgent.match(self.excludedUserAgents[userAgentIndex])) {
              log('Raygun4JS: cancelling send as error originates from an excluded user agent');
              return;
            }
          }
        }
      }

      if (self.excludedHostNames instanceof Array) {
        for (var hostIndex in self.excludedHostNames) {
          if (self.excludedHostNames.hasOwnProperty(hostIndex)) {
            if (
              window.location.hostname &&
              window.location.hostname.match(self.excludedHostNames[hostIndex])
            ) {
              log('Raygun4JS: cancelling send as error originates from an excluded hostname');

              return;
            }
          }
        }
      }

      if (navigator.userAgent.match('RaygunPulseInsightsCrawler')) {
        return;
      }

      var payload = self.beforeSend(data);
      if (!payload) {
        log('Raygun4JS: cancelling send because onBeforeSendRUM returned falsy value');
        return;
      }

      if (!!payload.eventData) {
        for (var i = 0; i < payload.eventData.length; i++) {
          if (!!payload.eventData[i].data && typeof payload.eventData[i].data !== 'string') {
            payload.eventData[i].data = JSON.stringify(payload.eventData[i].data);
          }
        }
      }

      var stringifiedPayload = JSON.stringify(payload);

      /**
       * Use the navigator.sendBeacon method instead of a XHR requests when transmitting data
       * This occurs mostly when the document is about to be discarded or hidden as
       * all inflight XHR requests either will be or can be canceled.
       */
      if (self.sendUsingNavigatorBeacon && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(url, stringifiedPayload);
        } catch (e) {
          log(e, {
            url: url,
            payload: stringifiedPayload
          });
        }
        return;
      }

      makePostCorsRequest(url, stringifiedPayload, successCallback, errorCallback);
    }

    // ================================================================================
    // =                                                                              =
    // =                                  Utilities                                   =
    // =                                                                              =
    // ================================================================================

    function getTimingDuration(timing) {
      /**
       * Safari timing entries (predominantly 'fetch' types) can have a
       * duration value of 0.
       *
       * This utility fallsback to using the responseEnd - startTime when
       * that is the case.
       */
      var duration = timing.duration;

      if(duration !== 0) {
        return duration;
      }

      return timing.responseEnd - timing.startTime;
    }
    this.Utilities["getTimingDuration"] = getTimingDuration;

    function resumeCollectingMetrics() {
      if(self.stopCollectingMetrics) {
        self.offset = window.performance.getEntries().length;
        self.stopCollectingMetrics = false;
      }
    }

    /**
     * Returns true if the resources entry type is set to "measure"
     */
    function isCustomTimingMeasurement(resource) {
      return !!(resource && resource.entryType === "measure");
    }
    this.Utilities["isCustomTimingMeasurement"] = isCustomTimingMeasurement;

    /**
     * Creates a custom timing measurement from a ResourceMeasure value passed.
     * The ResourceMeasure object passed in should be retrieved from the window.performance API
     */
    function getCustomTimingMeasurement(resource) {
      return createCustomTimingMeasurement(resource.name, resource.duration, resource.startTime);
    }
    this.Utilities["getCustomTimingMeasurement"] = getCustomTimingMeasurement;

    /**
     * Creates a custom timing measurement for a name and duration passed.
     * This can be used to create custom timings separate to the window.performance API
     */
    function createCustomTimingMeasurement(name, duration, offset) {
      return {
        url: name,
        timing: {
          t: Timings.CustomTiming,
          du: duration.toFixed(2),
          a: (offset || 0).toFixed(2)
        }
      };
    }
    this.Utilities["createCustomTimingMeasurement"] = createCustomTimingMeasurement;

    /**
     * Add to the requestMap. This marks the request as being in "flight"
     * and stops collecting metrics until this request has completed.
     */
    function xhrRequestHandler(request) {
      if(!this.xhrRequestMap[request.baseUrl]) {
        this.xhrRequestMap[request.baseUrl] = [];
      }

      log('adding request to xhr request map', request);

      this.xhrRequestMap[request.baseUrl].push(request);
    }

    /**
     * Removes the request from the requestMap so that metric collection can be resumed.
     */
    function xhrErrorHandler(response) {
      var request = this.xhrRequestMap[response.baseUrl];

      if(request && request.length > 0) {
        this.xhrRequestMap[response.baseUrl].shift();
        log('request encountered an error', response);
      }
    }

    /**
     * Removes the asset from the requestMap if found and adds the response to the
     * statusMap so that the status code can be associated with the request.
     *
     * If the 'captureMissingRequests' option is enabled and the timing metric is missing
     * the duration will also be used to create a new XHR timing.
     */
    function xhrResponseHandler(response) {
      var request = this.xhrRequestMap[response.baseUrl];

      if(request && request.length > 0) {
        this.xhrRequestMap[response.baseUrl].shift();

        if(this.xhrRequestMap[response.baseUrl].length === 0) {
          delete this.xhrRequestMap[response.baseUrl];
        }

        if (!this.xhrStatusMap[response.baseUrl]) {
          this.xhrStatusMap[response.baseUrl] = [];
        }

        log('adding response to xhr status map', response);
        this.xhrStatusMap[response.baseUrl].push(response);
      } else {
        log('response fired from non-handled request');
      }
    }

    function shouldIgnoreResource(resource) {
      var name = resource.name.split('?')[0];

      return shouldIgnoreResourceByName(name) || resource.entryType === "paint" || resource.entryType === "navigation" || resource.entryType === "mark";
    }

    function shouldIgnoreResourceByName(name) {
      if (name.indexOf(self.apiUrl) === 0) {
        return true;
      }
      if (name.indexOf('favicon.ico') > 0) {
        return true;
      }
      if (name.indexOf('about:blank') === 0) {
        return true;
      }
      if (name[0] === 'j' && name.indexOf('avascript:') === 1) {
        return true;
      }
      if (name.indexOf('chrome-extension://') === 0) {
        return true;
      }
      if (name.indexOf('res://') === 0) {
        return true;
      }
      if (name.indexOf('file://') === 0) {
        return true;
      }

      return false;
    }

    function sanitizeNaNs(data) {
      for (var i in data) {
        if (isNaN(data[i]) && typeof data[i] !== 'string') {
          data[i] = 0;
        }
      }

      return data;
    }

    function randomKey(length) {
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
        .toString(36)
        .slice(1);
    }

    function performanceEntryExists(entry, entryType) {
      return (
        typeof window.performance === 'object' &&
        (!entry || (entry && typeof window.performance[entry] === entryType))
      );
    }

    function getPerformanceNow(fallbackValue) {
      if (performanceEntryExists('now', 'function')) {
        return window.performance.now();
      } else {
        return fallbackValue;
      }
    }

    function maxFiveMinutes(milliseconds) {
      return Math.min(milliseconds, 300000);
    }

    function log(message, data) {
      if (self.debugMode && window.console && window.console.log) {
        if (data) {
          window.console.log(message, data);
        } else {
          window.console.log(message);
        }
      }
    }

    function createTimingPayload(data) {
      return {
        sessionId: self.sessionId,
        requestId: self.requestId,
        timestamp: new Date().toISOString(),
        type: 'web_request_timing',
        user: self.user,
        version: self.version || 'Not supplied',
        device: navigator.userAgent,
        tags: self.tags,
        data: data,
      };
    }

    function createRequestId() {
      self.requestId = randomKey(16);
    }

    function saveToStorage(value) {
      var lastActivityTimestamp = new Date().toISOString();
      var updatedValue = 'id|' + value + '&timestamp|' + lastActivityTimestamp;

      if(Raygun.Utilities.localStorageAvailable()) {
        localStorage.setItem(self.cookieName, updatedValue);
      } else {
        Raygun.Utilities.createCookie(self.cookieName, updatedValue, null, self.setCookieAsSecure);
      }
    }

    function getFromStorage() {
      /**
       * Attempt to get the value from local storage,
       * If that doesn't contain a value then try from a cookie as previous versions saved it here
       */
      var value;

      if(Raygun.Utilities.localStorageAvailable()) {
        value = localStorage.getItem(self.cookieName);
        if(value !== null) {
          return value;
        }
      }

      if(Raygun.Utilities.sessionStorageAvailable()) {
        value = sessionStorage.getItem(self.cookieName);
        if(value !== null) {
          saveToStorage(value);
          return value;
        }
      }

      value = Raygun.Utilities.readCookie(self.cookieName);

      /**
       * If there was a cookie and localStorage is avaliable then
       * clear the cookie as sessionStorage will be the storage mechanism going forward
       */
      if(value !== null && Raygun.Utilities.localStorageAvailable()) {
        Raygun.Utilities.clearCookie(self.cookieName);
        localStorage.setItem(self.cookieName, value);
      }

      return value;
    }

    function readStorageElement(cookieString, element) {
      var set = cookieString.split(/[|&]/);

      if (element === 'id') {
        return set[1];
      } else if (element === 'timestamp') {
        return set[3];
      }
    }

    function getSecondaryTimingType(timing) {
      if (isXHRTiming(timing.initiatorType)) {
        return Timings.XHR;
      } else if (isChildAsset(timing)) {
        return getTypeForChildAsset(timing);
      } else if (isChromeFetchCall(timing)) {
        return Timings.XHR;
      } else {
        return getTypeForChildAsset(timing);
      }
    }

    function isXHRTiming(initiatorType) {
      return (
        initiatorType === 'xmlhttprequest' ||
        initiatorType === 'fetch' ||
        initiatorType === 'preflight' || // 'preflight' initatorType used by Edge for CORS POST/DELETE requests
        initiatorType === 'beacon' // for navigator.sendBeacon calls in Chrome/Edge. Safari doesn't record the timings and Firefox marks them as 'other'
      );
    }

    function isChromeFetchCall(timing) {
      // Chrome doesn't report "initiatorType" as fetch
      return typeof timing.initiatorType === 'string' && timing.initiatorType === '';
    }

    function isChildAsset(timing) {
      switch (timing.initiatorType) {
        case 'img':
        case 'css':
        case 'script':
        case 'link':
        case 'other':
        case 'use':
          return true;
      }
      return false;
    }

    function getTypeForChildAsset(timing) {
      if (timing.duration === 0) {
        return Timings.CachedChildAsset;
      } else {
        return Timings.ChildAsset;
      }
    }

    /**
     * getCompareFunction() returns a predicate function to pass into the Array.sort() function
     * The predicate function checks for the property on each item being compared and returns the appropriate integer required by the sort function
     *
     * @param {string} property
     * @return {function} (a, b) => number
     */
    function getCompareFunction(property) {
      return function(a, b) {
        if (!a.hasOwnProperty(property) || !b.hasOwnProperty(property)) {
          log('Raygun4JS: Property "' + property + '" not found in items in this collection');
          return 0;
        }

        var propA = a[property];
        var propB = b[property];

        var comparison = 0;
        if (propA > propB) {
          comparison = 1;
        } else if (propA < propB) {
          comparison = -1;
        }
        return comparison;
      };
    }

    /**
     * sortCollectionByProperty() returns an array of objects sorted by a given property on those objects
     *
     * @param {array} collection
     * @param {string} property
     * @return {array} collection
     */
    function sortCollectionByProperty(collection, property) {
      return collection.sort(getCompareFunction(property));
    }

    _private.updateStorageTimestamp = updateStorageTimestamp;
  };
};

raygunRumFactory(window, window.jQuery, window.__instantiatedRaygun);

(function(window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;
  var hasLoaded = false,
    globalExecutorInstalled = false,
    errorQueue,
    delayedCommands = [],
    apiKey,
    options,
    attach,
    enablePulse,
    noConflict,
    captureUnhandledRejections;

  var snippetOnErrorSignature = ['function (b,c,d,f,g){', '||(g=new Error(b)),a[e].q=a[e].q||[]'];

  errorQueue = window[window['RaygunObject']].q;
  var rg = Raygun;

  var delayedExecutionFunctions = ['trackEvent', 'send', 'recordBreadcrumb'];

  var parseSnippetOptions = function() {
    snippetOptions = window[window['RaygunObject']].o;

    for (var i in snippetOptions) {
      if (snippetOptions.hasOwnProperty(i)) {
        var pair = snippetOptions[i];
        if (pair) {
          if (delayedExecutionFunctions.indexOf(pair[0]) === -1) {
            // Config pair, can execute immediately
            executor(pair);
          } else {
            // Action (posting) pair which requires lib to be fully parsed, delay till after Raygun obj has been init'd
            delayedCommands.push(pair);
          }
        }
      }
    }
  };

  var executor = function(pair) {
    var key = pair[0];
    var value = pair[1];

    if (key) {
      switch (key) {
        // React Native only
        case 'boot':
          onLoadHandler();
          break;
        // Immediate execution config functions
        case 'noConflict':
          noConflict = value;
          break;
        case 'apiKey':
          apiKey = value;
          hasLoaded = true;
          break;
        case 'options':
          options = value;
          break;
        case 'attach':
        case 'enableCrashReporting':
          attach = value;
          hasLoaded = true;
          break;
        case 'enablePulse':
          enablePulse = value;
          hasLoaded = true;
          break;
        case 'detach':
          rg.detach();
          break;
        case 'getRaygunInstance':
          return rg;
        case 'setUser':
          rg.setUser(
            value.identifier,
            value.isAnonymous,
            value.email,
            value.fullName,
            value.firstName,
            value.uuid
          );
          break;
        case 'onBeforeSend':
          rg.onBeforeSend(value);
          break;
        case 'onBeforeSendRUM':
          rg.onBeforeSendRum(value);
          break;
        case 'onBeforeXHR':
          rg.onBeforeXHR(value);
          break;
        case 'onAfterSend':
          rg.onAfterSend(value);
          break;
        case 'withCustomData':
          rg.withCustomData(value);
          break;
        case 'withTags':
          rg.withTags(value);
          break;
        case 'setVersion':
          rg.setVersion(value);
          break;
        case 'filterSensitiveData':
          rg.filterSensitiveData(value);
          break;
        case 'setFilterScope':
          rg.setFilterScope(value);
          break;
        case 'whitelistCrossOriginDomains':
          rg.whitelistCrossOriginDomains(value);
          break;
        case 'saveIfOffline':
          if (typeof value === 'boolean') {
            rg.saveIfOffline(value);
          }
          break;
        case 'groupingKey':
          rg.groupingKey(value);
          break;
        case 'endSession':
          rg.endSession();
          break;

        // Delayed execution functions
        case 'send':
          var error, tags, customData;
          if (value.error) {
            error = value.error;

            if (value.tags) {
              tags = value.tags;
            }
            if (value.customData) {
              customData = value.customData;
            }
          } else {
            error = value;
          }
          rg.send(error, customData, tags);
          break;
        case 'trackEvent':
          if (value.type && value.path) {
            rg.trackEvent(value.type, { path: value.path });
          } else if(value.type && value.name && value.duration) {
            rg.trackEvent(value.type, { name: value.name, duration: value.duration, offset: value.offset });
          } else if (value.type && value.timings) {
            rg.trackEvent(value.type, { timings: value.timings });
          }
          break;
        case 'recordBreadcrumb':
          rg.recordBreadcrumb(pair[1], pair[2]);
          break;
        case 'enableAutoBreadcrumbs':
          rg.enableAutoBreadcrumbs();
          break;
        case 'disableAutoBreadcrumbs':
          rg.disableAutoBreadcrumbs();
          break;
        case 'enableAutoBreadcrumbsConsole':
          rg.enableAutoBreadcrumbs('Console');
          break;
        case 'disableAutoBreadcrumbsConsole':
          rg.disableAutoBreadcrumbs('Console');
          break;
        case 'enableAutoBreadcrumbsNavigation':
          rg.enableAutoBreadcrumbs('Navigation');
          break;
        case 'disableAutoBreadcrumbsNavigation':
          rg.disableAutoBreadcrumbs('Navigation');
          break;
        case 'enableAutoBreadcrumbsClicks':
          rg.enableAutoBreadcrumbs('Clicks');
          break;
        case 'disableAutoBreadcrumbsClicks':
          rg.disableAutoBreadcrumbs('Clicks');
          break;
        case 'enableAutoBreadcrumbsXHR':
          rg.enableAutoBreadcrumbs('XHR');
          break;
        case 'disableAutoBreadcrumbsXHR':
          rg.disableAutoBreadcrumbs('XHR');
          break;
        case 'setBreadcrumbLevel':
          rg.setBreadcrumbOption('breadcrumbsLevel', pair[1]);
          break;
        case 'setAutoBreadcrumbsXHRIgnoredHosts':
          rg.setBreadcrumbOption('xhrIgnoredHosts', pair[1]);
          break;
        case 'logContentsOfXhrCalls':
          rg.setBreadcrumbOption('logXhrContents', pair[1]);
          break;
        case 'clientIp':
          rg.setClientIp(value);
          break;
        case 'captureMissingRequests':
          rg.captureMissingRequests(value);
          break;
        case 'captureUnhandledRejections':
          captureUnhandledRejections = value;
          break;

        default:  //ak
          throw new Error(`Unexpected key: ${key}`)
      }
    }
  };

  var installGlobalExecutor = function() {
    window[window['RaygunObject']] = function() {
      return executor(arguments);
    };

    globalExecutorInstalled = true;
  };

  var onLoadHandler = function() {
    parseSnippetOptions();

    if (noConflict) {
      rg = Raygun.noConflict();
    }

    if (apiKey) {
      if (!options) {
        options = {};
      }

      if (enablePulse) {
        options.disablePulse = false;
      }

      options.from = 'onLoad';
      rg.init(apiKey, options, null);
    }

    if (attach) {
      rg.attach();

      errorQueue = window[window['RaygunObject']].q;
      for (var j in errorQueue) {
        rg.send(errorQueue[j].e, { handler: 'From Raygun4JS snippet global error handler' });
      }
    } else if (typeof window.onerror === 'function') {
      var onerrorSignature = window.onerror.toString();
      if (
        onerrorSignature.indexOf(snippetOnErrorSignature[0]) !== -1 &&
        onerrorSignature.indexOf(snippetOnErrorSignature[1]) !== -1
      ) {
        window.onerror = null;
      }
    }

    for (var commandIndex in delayedCommands) {
      if (delayedCommands.hasOwnProperty(commandIndex)) {
        executor(delayedCommands[commandIndex]);
      }
    }

    delayedCommands = [];

    if (!globalExecutorInstalled) {
      installGlobalExecutor();
    }

    window[window['RaygunObject']].q = errorQueue;
  };

  if (!Raygun.Utilities.isReactNative()) {
    if (document.readyState === 'complete') {
      onLoadHandler();
    } else if (window.addEventListener) {
      window.addEventListener('load', onLoadHandler);
    } else {
      window.attachEvent('onload', onLoadHandler);
    }
  } else {
    // Special case for React Native: set up the executor immediately,
    // then a manual rg4js('boot') call will trigger onLoadHandler, as the above events aren't available
    installGlobalExecutor();
  }
})(window, window.__instantiatedRaygun);

try {
  delete window.__instantiatedRaygun;
} catch (e) {
  window['__instantiatedRaygun'] = undefined;
}
const rg4js = window.rg4js || fail("No '.rg4js'");

// Note: Must leave 'window.rg4js' to exist, since the UMD-inherited loading mechanism uses it.
//window.rg4js = undefined;

function fail(msg) { throw new Error(msg) }

//--- Takeover instrumentation

let _processExceptionF = () => fail("'takeOver' not called before 'processException' called by RG plain")
let _makePostCorsRequestF = () => fail("'takeOver' not called before 'makePostCorsRequest' called by RG plain")

/*
* Replaces 'processException' within the Plain client code. Used for testing
* or replacing the send/offline store logic.
*/
function processException(stackTrace, options, userTriggered, error) {

  console.log("!!! processException", { stackTrace, options, userTriggered, error });
    //
    // stackTrace:  {
    //    mode: 'stack'
    //    name: 'Error'
    //    message: string
    //    url: 'http://localhost/'
    //    stack: Array of object
    //    useragent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/16.7.0'
    //    stackString: ...multiline string...
    //  }
    //  options: { customData: {}, tags: [] }
    //  userTriggered: boolean
    //  error: Error

  return _processExceptionF(stackTrace, options, userTriggered, error);
}

function makePostCorsRequest(url, data, _successCallback, _errorCallback) {
  console.log("!!! makePostCorsRequest", { url, data, _successCallback, _errorCallback });

  return _makePostCorsRequestF(url, data, _successCallback, _errorCallback);
}

function takeOver({ processException, makePostCorsRequest } ) {
  if (processException) _processExceptionF = processException;
  if (makePostCorsRequest) _makePostCorsRequestF = makePostCorsRequest;
}

export { rg4js, takeOver }
