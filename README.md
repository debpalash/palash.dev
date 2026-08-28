# palash.dev — Solid edition

The reading mode of [palash.dev](https://palash.dev) (profile, work, blog, lab, media,
product pages) rebuilt on **Solid 2.0 RC** with the Start functionality that is now
embedded in the platform: `@solidjs/vite-plugin` (`start: true, ssr: true`) streams
SSR from a Cloudflare Worker.

The retro **PALASH.OS** desktop (`/os`) is *not* part of this project — it stays in
the original Astro repo and keeps serving `/os` on the domain.

## Stack

- `solid-js` / `@solidjs/web` `2.0.0-rc`, `@solidjs/router` `2.0.0-next`,
  `@solidjs/meta` `1.0.0-next`, `@solidjs/vite-plugin` `3.0.0-next` (coordinated release)
- `filesystem-routing` — file-system pages in `src/routes` plus HTTP-method API routes
  (`rss.xml.ts`, `sitemap.xml.ts`, `llms.txt.ts`, …)
- `@cloudflare/vite-plugin` + `wrangler.jsonc` (`main: virtual:solid-ssr-handler`)
- `src/styles/page.css` is copied verbatim from the Astro site; components render the
  exact same class names, so the two deployments stay visually identical.

## Content

Products/experiments/gallery/company are the same JSON files under `src/content`.
Blog posts are markdown in `src/content/blog`; `scripts/gen-content.mjs` renders them
to HTML at build time (GFM + smart quotes + heading ids + shiki `github-dark-default`)
so the Worker ships zero markdown machinery.

## Build-time metrics

The product download figure counts uploaded binary and archive assets from public,
stable GitHub releases. It includes AppImage, DMG, MSI, EXE, ZIP, DEB, RPM, RUN,
and TAR.GZ files. It excludes drafts, prereleases, updater metadata, checksums,
signatures, and scripts.

Docker Hub pulls and GHCR downloads stay in the generated stats breakdown for
analysis. The public download figure does not add them to release-file downloads.

## Commands

```sh
npm run dev      # gen content + vite dev (workerd)
npm run build    # gen content + vite build -> dist/client + dist/server
npm run preview  # serve the production build locally
npm run deploy   # build + wrangler deploy
```
