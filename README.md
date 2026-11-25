# palash.dev

Portfolio and blog styled as a classic Mac OS X desktop. Astro 7 builds static HTML; Solid handles search. Base UI React tabs are isolated to the publishing preview. Unhead 3 renders metadata and JSON-LD at build time.

## Development

```sh
npm ci
npm run dev          # localhost:3003
npm run lint
npm test
npm run build        # static output in dist/
npm run test:site    # production HTML and assets
npm run test:browser # build first; launches local preview
npm run seo:audit    # build + metadata/schema/crawl audit
npm run deploy       # audit, test, and publish to Cloudflare
```

Browser checks use Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`).

## Publishing

- `src/content/blog/`: Markdown/MDX. Required frontmatter: title, description, publishDate. Optional: updatedDate, tags, draft. Drafts and future posts are excluded.
- `src/content/products/`: project JSON validated by Astro content collections.
- `src/lib/page-data.ts`: metadata and Person, Organization, WebSite, ImageObject, BlogPosting, SoftwareApplication, SoftwareSourceCode, breadcrumb and collection schemas.
- `src/lib/head.ts`: canonical, robots, Open Graph, Twitter, alternate links and JSON-LD through Unhead.
- `/preview/`: search snippets, social images, schema and rendered-head inspection. Preview and search are noindex.
- `/social/*.png`: generated 1200×630 cards from page metadata. Historical OG assets remain available.
- Product and article pages expose same-origin Markdown mirrors; product mirrors include capabilities, evidence and comparison tables. `llms.txt` indexes those canonical sources and `llms-full.txt` provides optional expanded context. Mirrors are available to agents but marked noindex to prevent search duplication.
- RSS, sitemaps and résumé downloads remain available. No hidden keyword copy or bot-only content.

Design tokens live in `src/styles/site.css` (light and dark); native platform font stacks avoid runtime font downloads. `src/components/Backdrop.astro` renders minified cached artwork from `public/backdrop.svg`, and the homepage serves a responsive local hero image. Only search and the publishing preview load framework islands. Legacy `/os/` redirects home.

## Metrics and deployment

GitHub stats refresh with cached fallback. Public download totals count binary/archive assets from stable releases, excluding prereleases, checksums, updater metadata and scripts. Registry pulls remain separate. Tests cover counting and token sanitization.

Static assets deploy through `wrangler.jsonc`; `public/_headers` gives hashed bundles immutable caching, same-origin media day-long caching, machine-readable files explicit content types and mirrors noindex headers. Decorative artwork, fonts and product media do not depend on third-party origins. SEO checks enforce local assets, schema, feed discovery, crawl policy and payload budgets. Metadata cannot guarantee indexing or AI citations.
