/*
* config.js
*
* Common configuration.
*
* Separated from 'index.js' so subpackages can access this directly.
*/
import { name as PACKAGE_NAME, version as PACKAGE_VERSION } from '../package.json'

export {
  PACKAGE_NAME,     // "raygun4esm"
  PACKAGE_VERSION   // "0.0.0{|-alpha.x|-beta.x}"
}
