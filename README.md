# Gen4Zero

> Begin at zero. Shape what emerges.

An open, browser-native generative instrument for shaping visual systems from seed to form.

![Gen4Zero social preview](./og.png)

## What it includes

- Six deterministic systems: vector field, orbital bloom, cellular veil, recursive grid, moiré signal, and particle loom.
- Reproducible seeds plus controls for density, complexity, motion, continuity, scale, weight, and grain.
- A second generative layer with blend modes for composing systems rather than choosing only one pattern.
- Output presets for web heroes, Full HD, vertical video, portrait and square feeds, social cards, and A-series posters.
- PNG export, five-second WebM recording, portable JSON recipes, and shareable recipe URLs.
- A curated public Gallery and a separate, local-only collection stored in the browser.
- No account, analytics, upload, server runtime, or build dependency.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:4173`.

## Project structure

```text
index.html          Interface and metadata
styles.css          Visual system and responsive layout
app.js              Renderers, recipes, gallery, and export logic
docs/PRODUCT.md     Product model and roadmap
tests/              Dependency-free checks
.github/workflows/  GitHub Pages deployment
```

## Make it your own

The quickest extension points are the `patterns`, `palettes`, `presets`, and `curatedWorks` objects in `app.js`. A renderer receives a canvas context, dimensions, a normalized recipe, time, and whether it is being used as a secondary layer.

Artwork recipes are plain JSON. This makes a visual result reviewable, versionable, and remixable without shipping a raster source file.

## Engineering loop

Gen4Zero uses a risk-graded loop for human and agent contributions. Every change moves through scope, implementation, deterministic checks, visual review when relevant, an inspectable pull request, deployment, and live verification. Start with [`AGENTS.md`](./AGENTS.md) and [`docs/ENGINEERING.md`](./docs/ENGINEERING.md).

Run the same release gate used by GitHub Actions:

```bash
npm run verify:release
```

## Publish

The included workflow deploys the repository root to GitHub Pages on pushes to `main`. Before the first run, choose **GitHub Actions** as the repository's Pages source.

Recommended URL strategy:

1. Use this as a standalone repository named `gen4zero`.
2. Publish at the default project URL first.
3. Configure `gen4zero.zzao.im` as the repository's custom domain.
4. Point the DNS `CNAME` for `gen4zero` to `hominthesky.github.io` and enforce HTTPS after GitHub issues the certificate.

The repository includes a `CNAME` file so the intended public origin travels with the release artifact.

## License

[MIT](./LICENSE) for the software. Curated artwork authorship remains attributed to Z4Zero unless a contribution says otherwise; the software license does not automatically grant rights to individual gallery works or brand marks.
