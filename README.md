# Z4Zero / Generative Studio

> Make living visual systems.

A browser-native generative art instrument for tuning systems, combining layers, reproducing results with seeds, and exporting artwork for real-world canvases.

![Z4Zero Generative Studio preview](./og.png)

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

## Publish

The included workflow deploys the repository root to GitHub Pages on pushes to `main`. Before the first run, choose **GitHub Actions** as the repository's Pages source.

Recommended URL strategy:

1. Use this as a standalone repository named `z4zero-generative-studio`.
2. Publish at the default project URL first.
3. Configure `studio.zzao.im` as the repository's custom domain when ready.
4. Point the DNS `CNAME` for `studio` to `hominthesky.github.io` and enforce HTTPS after GitHub issues the certificate.

The custom domain belongs in the repository's Pages settings when this workflow is used; a committed `CNAME` file is not required.

## License

[MIT](./LICENSE) for the software. Curated artwork authorship remains attributed to Z4Zero unless a contribution says otherwise.
