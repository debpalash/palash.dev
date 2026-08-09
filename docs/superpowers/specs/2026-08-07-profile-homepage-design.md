# Profile-style simple mode

**Date:** 2026-08-07
**Status:** approved, not yet implemented

## Problem

The simple mode at `/` reads as basic. It is a plain `h1`, a blurb, and four
stacked sections of name-plus-one-line rows. It carries the site's whole
content set but gives a visitor no sense of a person behind it, and nothing on
the page rewards scrolling.

The retro desktop at `/os` has personality. The clean side has none.

## Solution

Rebuild the clean side as a social profile — the Bluesky/Twitter shape, adapted
for a portfolio. A dense identity header establishes who this is, and a tab bar
under it splits the content into feeds.

Two properties from the current build are non-negotiable and survive intact:

- **Zero JavaScript on clean routes.** The only script remains the existing
  `/os#…` hash-forwarder on `/`.
- **`/os` is untouched.** No file under `src/components/os/`, no rule in
  `global.css`, and no line of `os.astro` changes.

## Routes

Four profile pages share one shell. Detail pages keep the narrow article layout
they have today.

| Route                    | Tab         | Source              | Work         |
| ------------------------ | ----------- | ------------------- | ------------ |
| `/`                      | Work        | `products` (3)      | rewrite      |
| `/blog`                  | Writing     | `blog` (9)          | rewrite      |
| `/lab`                   | Experiments | `experiments` (6)   | new          |
| `/media`                 | Media       | `gallery` (23)      | new          |
| `/memxt` `/opal` `/omnivoice` | —      | `products`          | nav only     |
| `/blog/:slug`            | —           | `blog`              | nav only     |
| `/os`                    | —           | —                   | **untouched** |

`/lab` and `/media` are static files, so Astro's route precedence puts them
ahead of `[slug].astro` — the same mechanism `/os` already depends on. Neither
name collides with a product id.

Detail pages deliberately do **not** repeat the profile header, matching how a
tweet-detail view drops the profile chrome. Their only change is inherited: the
slimmed `Nav` described below. Their body markup is untouched.

`/blog` loses its current "The Log" hero, which the profile header replaces.

### Tabs are real routes, not client state

Each tab is its own static page rendering a shared `ProfileHeader`. This keeps
zero JS, makes every tab independently indexable and linkable, and gives correct
back-button behaviour for free. It is also how `twitter.com/user/media` works.

The cost is a full page load per tab switch. At 16K of cached CSS and no JS,
that is acceptable.

## Components

```
src/layouts/Profile.astro          wraps Page.astro
  <ProfileHeader />
  <TabBar active="work" />
  <div class="profile-grid">
    <div class="feed">   <slot />
    <aside class="rail"> <slot name="rail" />

src/components/profile/
  ProfileHeader.astro    banner, avatar, identity, counts, actions
  TabBar.astro           active: 'work' | 'writing' | 'lab' | 'media'
  Rail.astro             YUPCHA card, Stack card, Elsewhere card
  FeedItem.astro         generic row: avatar column + body + optional media
  WorkFeed.astro         products    -> FeedItem + screenshot
  WritingFeed.astro      blog        -> FeedItem + date
  LabFeed.astro          experiments -> FeedItem
  MediaGrid.astro        gallery     -> grid
```

### Deleted

`Section.astro`, `WorkList.astro`, `PostList.astro` and `LinkList.astro` are
superseded — every consumer moves to the feed components.

`GalleryStrip.astro` stays. `[slug].astro` still uses it for product
screenshots, where a strip beats a grid.

### Nav is slimmed

The top `Nav` currently carries *work / writing / github / fun mode*, which the
tab bar now duplicates outright — three stacked navigation strips. `Nav` drops
to brand plus `fun mode ↗` sitewide. Tabs handle section navigation on profile
pages; detail pages keep their existing `← back` link.

## Data flow

`ProfileHeader` fetches all five collections itself to compute its counts. The
four tab pages each load only their own collection and hand it to their feed
component.

One source of truth for "3 shipped · 9 posts · 6 experiments", and no
prop-drilling through the layout.

## Assets

| Asset  | Source                                       | Destination                        | Size  |
| ------ | -------------------------------------------- | ---------------------------------- | ----- |
| Avatar | `github.com/debpalash.png` (460×460)         | `public/avatar.webp` — 256×256     | 6.1K  |
| Banner | `docs/screenshot.png` (1440×900, in repo)    | `public/banner.webp` — 1440×360    | 32K   |

Both assets are produced **once during implementation and committed** — a
download plus resize for the avatar, a centred crop for the banner. Neither is
fetched or generated at build time, so the build stays offline-capable.

They are pre-sized and served with a plain `<img>` carrying explicit
`width`/`height`, **not** through Astro's `<Image>`. The project's image service
is `@unpic/astro` with `fallbackService: 'cloudflare'`, which is pure-URL by
design — sharp's native CJS cannot load in the workerd dev runtime, so local
assets are never transformed at build time. `<Image>` would emit the original
bytes unchanged. Pre-sizing is what actually makes them small.

The avatar is vendored rather than hotlinked: no external request, no layout
shift, and no dependency on GitHub being reachable at page load.

The banner is a dimmed slice of the retro desktop, linking to `/os`. The cover
photo is the other mode — it advertises `/os` without a sentence of
explanation.

## Visual system

New tokens layered onto the existing `page.css` set. No existing token changes.

```css
--feed-w: 600px;   --rail-w: 320px;   --col-gap: 2rem;
--banner-h: 200px; --avatar: 128px;   --tab-h: 3rem;
```

**Header.** Banner fills `--banner-h` with `object-fit: cover` and an `::after`
gradient fading to `--bg`, so the name below stays legible against any crop. The
strip is a link to `/os` labelled "PALASH.OS — the desktop version". The avatar
overlaps it by half (`margin-top: -64px`), circular, with a 4px `--bg` ring.
Action buttons sit top-right on the avatar's row: `RSS` filled primary, `✉` icon
button, `fun mode ↗` outlined. Below: name at 1.5rem/700, `@debpalash` in muted
mono, bio capped at 60ch, a mono meta row (location, site, stack), and counts
rendered as links with a bold number and muted label.

There are exactly three counts — shipped, posts, experiments — linking to `/`,
`/blog` and `/lab`. Media has no count; it is reachable from its tab.

RSS occupies the Follow slot because it is the honest portfolio equivalent of
following.

**Tab bar.** Sticks at `top: var(--nav-h)` with a blurred `--bg` backdrop, so
nav and tabs stack rather than overlap. Active tab takes a 3px `--accent`
underline and full-strength text; inactive is `--text-muted`.

**Feed item.** `grid-template-columns: 48px 1fr`, 1rem vertical padding,
`--border` hairline between rows. The whole row is one link; hover fills
`--bg-subtle`, bleeding into the gutter via negative margin. Title at 1rem/600
with `@slug` or date in muted mono on the same line; description in
`--text-muted`; attached screenshot at 16/10 with a 12px radius, lazy-loaded.

**Media tab** is a grid rather than a feed — 3 columns desktop, 2 mobile, 4px
gutters, each tile linking to its product page.

**Rail.** Sticky at `calc(var(--nav-h) + var(--tab-h) + 1rem)`. Three cards on
`--bg-subtle`, 14px radius: YUPCHA (blurb plus its 4 repos), Stack (mono chips),
Elsewhere (github, email, rss, ko-fi, paypal from `SITE.links`).

### Row density

Rows carry an icon, title, `@slug`, one-line description, and an optional
screenshot. They do **not** carry stars, download counts, status chips or stack
tags — those stay on the detail pages.

This refines the earlier minimal-rows rule rather than reversing it: images add
the substance the page was missing, badges were never the thing that was
missing.

## Responsive

| Width       | Behaviour                                                             |
| ----------- | --------------------------------------------------------------------- |
| ≥1040px     | Two columns — 600 + 320, centred                                      |
| 768–1039px  | Single column capped at 600px; rail cards drop below the feed         |
| <768px      | Fluid; banner 120px, avatar 72px, tabs scroll horizontally, media 2-col |
| <400px      | Counts wrap to two lines; action buttons shrink to icons              |

## Edge cases

- An empty collection renders a muted "Nothing here yet." rather than a bare
  section.
- A product with no gallery shot renders a shorter row. No placeholder box.
- If the banner image fails to load, a CSS gradient sits underneath it.
- Long names and bios wrap; nothing is truncated with ellipsis.
- `prefers-reduced-motion` is already handled globally; hover transforms respect
  it.

## Accessibility

The tab bar is `<nav aria-label="Profile sections">` with `aria-current="page"`
on the active tab. Count links carry full text, not bare numbers. The avatar's
`alt` is the person's name; the banner link has an explicit `aria-label`. The
existing skip-link and focus-visible rings are retained.

## SEO

`/` keeps the canonical entity graph — Person, Organization, WebSite, and one
SoftwareApplication per product — unchanged.

`/blog` keeps its existing Blog and BreadcrumbList graph.

`/lab` and `/media` each gain `CollectionPage` and `BreadcrumbList` nodes tied
to `#website`, their own title, description and OG image, and two new entries in
`scripts/gen-og.mjs` alongside the existing per-product, per-post and blog-index
cards.

The sitemap integration picks up both new routes with no configuration.

## Verification

The repo has no test runner, so verification is a build plus visual checks:

1. `bun run build` completes clean and route count rises from 16 to 18.
2. Headless screenshots at 390, 768 and 1440 across all four tabs, light and
   dark.
3. `/` still emits exactly two script tags — the JSON-LD block and the
   hash-forwarder.
4. `/os` renders identically to before the change.

## Out of scope

- Any change to `/os`, including the decluttering discussed earlier (fewer
  icons, calmer first load, quieter taskbar). That remains open and separate.
- A unified reverse-chronological timeline. It needs dates on products and
  experiments, which the schemas do not carry.
- Live GitHub data — follower counts, contribution heatmaps, star counts.
