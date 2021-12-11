/*
* types/user.d.ts
*
* Based on:
*   - API Reference
*     -> https://raygun.com/documentation/product-guides/crash-reporting/api/
*/

// Raygun object on a user
//
declare interface User {
  identifier: string,     // "Unique identifier for the user"
  isAnonymous: boolean,   // true: it's a guest (not logged in); false (logged in, including "anonymous login" ála Firebase!)

  //email: string
  //fullName: string
  //firstName: string

  //uuid: string
}
