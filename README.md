# Raygun for ESM capable browsers

A re-packaging of [`raygun4js`](https://www.npmjs.com/package/raygun4js) intended for projects that use browser native ECMAScript Modules (ESM).

>Note: This repo refers to `raygun4js` as the "plain client/API".


## File system

```
- demo/       # sample web app for manually testing the package
- package/    # everything ending up in 'npm' registry, when published
```


## Requirements

- `npm`
- Raygun license

   Creating a dedicated app in the Raygun console for trying this out is recommended. 
   
   >To just try out (without dashboard), you can provide a fake API key like `RAYGUN_API_KEY=x`.

<!-- Developed on:
- macOS 12.0
- node 17.2
- npm 8.1
-->


## Development

```
$ npm install
```

```
$ RAYGUN_API_KEY=... npm run dev
...
```

Open [localhost:5000](http://localhost:5000) and follow the instructions to exercise the client and confirm that data gets shipped to your Raygun app.


## Terminology

|||
|---|---|
|app|Raygun calls a collection of data in the online dashboard an "app". This is more like a *project*, *tier* or *instance*.|


## References

- [Plain JS client](https://github.com/MindscapeHQ/raygun4js) (GitHub)

