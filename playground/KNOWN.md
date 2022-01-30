# Known issues

## Browser log: `Unrecognized feature: 'interest-cohort'`

```
Error with Permissions-Policy header: Unrecognized feature: 'interest-cohort'.
```

Seems one can ignore this.

- [ ] If you know how to turn it off, please let the author know.

## 🦞🦞🦞 Mdsvex syntax highlighting (in WebStorm)

This is a major turnoff for WebStorm / mdsvex use at the moment (Dec 2021).

[Mdsvex](https://mdsvex.com) allows writing web apps using Markdown and *I'm definitely not going away from it*. It simplifies text intensive things like the Playground.

The problem is that there's currently absolutely no highlighting for the `.svelte.md` files (or whatever you want to call them); this is more important because this kinds of files bundle in so many formats. `.svelte` has CSS, JavaScript and HTML. A `.svelte.md` syntax highlighter should be capable of handling Markdown as well (and Svelte-like espaces from it, as shown by the below example):

![](./.images/webstorm-no-mdsvex.png)

There is a [MDX plugin](https://plugins.jetbrains.com/plugin/14944-mdx).

*tbd. Ticket to suggest and follow this...*

*Note: Official postfix for mdsvex is `.svx`.*
