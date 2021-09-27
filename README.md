# Raygun for ESM capable browsers

A re-packaging of [Raygun4js](https://www.npmjs.com/package/raygun4js) intended for projects that use browser native ECMAScript Modules (ESM).


## File system

```
- demo/       # sample web app for manually testing the package
- package/    # everything ending up in 'npm' registry, when published
```


## Requirements

- `npm`
- Raygun license 

   Creating a dedicated app for trying this out is recommended. 
   
   >To just try out (without dashboard), you can provide a fake API key like `RAYGUN_API_KEY=x`.


## Development

```
$ npm install
```

```
$ RAYGUN_API_KEY=... npm run dev
...
```

Open [localhost:5000](http://localhost:5000) and follow the 1..n path on manual tests.

Follow your Raygun application's dashboard to see what gets shipped.


## References

- [Plain JS client](https://github.com/MindscapeHQ/raygun4js) (GitHub)

