/*
* types/all.d.ts
*
* Based on:
*   - API Reference [#1]
*     -> https://raygun.com/documentation/product-guides/crash-reporting/api/
*/

// Raygun Breadcrumb
//
declare interface Breadcrumb {
  // "Milliseconds since the Unix Epoch"
  timeStamp: number,

  // "The display level of the message (valid values are Debug, Info, Warning, Error)
  level?: 'debug'|'info'|'warning'|'error',    // tbd. case??? (see #1)

  // "The type of message"    // tbd. Are all values allowed for a web app, eg. 'request'?
  type?: 'manual'|'navigation'|'click-event'|'request'|'console',

  // "Any value to categorize your messages"
  category?: string,   // "checkout"

  // "The message [your app wants] to record"
  message?: string,   // "User navigated to the shopping cart"

  // "[...] class name from where the breadcrumb was recorded"
  className?: string,    // "ShoppingCart"

  // "[...] method name from where the breadcrumb was recorded"
  methodName?: string,    // "ViewBasket"

  // "[...] a line number from where the breadcrumb was recorded"
  lineNumber?: number,    // 156

  // "custom data [...] about application state"
  customData?: object
}

// Raygun user
//
declare interface User {
  identifier: string,     // "Unique identifier for the user"
  isAnonymous: boolean,   // true: it's a guest (not logged in); false (logged in, including "anonymous login" ála Firebase!)

  //email: string
  //fullName: string
  //firstName: string

  //uuid: string
}
