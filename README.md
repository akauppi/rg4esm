# Raygun for ESM capable browsers

A Raygun client for projects that use browser native ECMAScript Modules (ESM).

>Note: This repo refers to the official `raygun4js` client as the "plain client".

## Why?

The [plain JS client](https://github.com/MindscapeHQ/raygun4js) (GitHub) cannot be used in pure ESM browser projects. Maybe Raygun fixes that - maybe not.

Having looked at the source code, there's a lot that can be simplified, if only modern "evergreen" browsers are targeted. This client does this leap. 

- dropping IE support
- can rely on many browser features instead of conditional code

The outcome is a client further away from plain client's API than the author would have hoped for, but maybe these things can be converged.

## File system

```
- demo/       # sample web app for manually testing the package
- package/    # everything ending up in 'npm' registry, when published
```

>Note: We'd like to have automated tests (`npm test`), but that hasn't been made, yet.


## Requirements

- `npm`
- Raygun API key (for the demo)

   Create a dedicated app in the Raygun console for running the demo.

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


<!--
## References
-->