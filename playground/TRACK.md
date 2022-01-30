# Track

Things that are `playground` specific. See `../TRACK.md` for the whole repo.

---

## SvelteKit: unnecessary dev warning: `received an unexpectd slot "default"`

Discussed in:

- [&lt;Routes&gt; received an unexpected slot "default".](https://github.com/sveltejs/kit/issues/981) (Svelte/kit)
- ...leads to [Incorrect error message "... received an unexpected slot "default".](https://github.com/sveltejs/svelte/issues/6325) (Svelte)

- [ ] Once fixed, remove these work-arounds in route files:

   ```
   {#if false}<slot/>{/if}
   ```
