# Playground

A web app for trying out Raygun integration in practise.


## Requirements

- npm
- Raygun API key

  Save the Raygun API key in `.env.local`:

  ```
  VITE_RAYGUN_API_KEY=PzE8...kfYQ
  ```


## Usage

```
$ npm install
```

```
$ npm run dev
```

- Open `http://localhost:3000` to see the playground and follow its instructions.
- Open the [Raygun console](https://app.raygun.com) matching the API key, so you can validate that things get reported.


## References

### Kudos 👸🏼

- The use of MDSveX is based on [mvasigh/sveltekit-mdsvex-blog](https://github.com/mvasigh/sveltekit-mdsvex-blog).

   *This repo helped me understand how SvelteKit works, providing a <u>working,
   minimal</u> tutorial-like repo! Took me past the frustration.*
