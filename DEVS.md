# Dev notes

## Defining types in JSDoc

The sources include type definitions for the APIs, without requiring TypeScript.

```
/**
* @type { (string, { appVersion?: string, tags: string[], errorMonitoring?: {}|bool, realUserMonitoring?: {}|bool }) => void }
*/
```

See [Support for TypeScript types in JSDoc](https://blog.jetbrains.com/webstorm/2021/06/webstorm-2021-2-eap-4/#support_for_typescript_types_in_jsdoc) (Webstorm blog, Jun 2021)

### References

- [A quick introduction to “Type Declaration” files and adding type support to your JavaScript packages](https://medium.com/jspoint/typescript-type-declaration-files-4b29077c43) (blog, Aug 2020)
- [Better mapping between .js and .d.ts files](https://blog.jetbrains.com/webstorm/2021/10/webstorm-2021-3-eap-4/#better_mapping_between_js_and_d_ts_files) (WebStorm release notes, Oct 2021)

