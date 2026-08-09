# Profile-Style Simple Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the clean side of palash.dev as a Bluesky/Twitter-style profile — a dense identity header plus four tabbed feeds — without adding a single byte of JavaScript.

**Architecture:** Four static routes (`/`, `/blog`, `/lab`, `/media`) each render a shared `Profile` layout: `ProfileHeader` (banner, avatar, bio, counts), a sticky `TabBar`, a feed column, and a sticky right rail. Tabs are real pages rather than client-side state, so navigation costs no JS and every tab is independently indexable. Detail pages (`/memxt`, `/blog/:slug`) keep today's narrow article layout.

**Tech Stack:** Astro 7 (static output, Cloudflare adapter), plain CSS in `src/styles/page.css`, IBM Plex Mono via `@fontsource`, no client framework, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-07-profile-homepage-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Zero JavaScript on clean routes.** After this work, `/` emits exactly two `<script>` tags — the JSON-LD block and the existing `/os#…` hash-forwarder. `/blog`, `/lab` and `/media` emit exactly one (JSON-LD).
- **`/os` is untouched.** Do not modify `src/pages/os.astro`, `src/layouts/OS.astro`, `src/styles/global.css`, or anything under `src/components/os/`.
- **All new CSS goes in `src/styles/page.css`.** Never `global.css` — that stylesheet belongs to `/os` and keeping them disjoint is what makes these routes light.
- **No new dependencies.** `package.json` must be unchanged at the end.
- **Rows never show stars, download counts, status chips or stack tags.** Screenshots are allowed; badges and counters are not. Status and stack stay on detail pages.
- **Local images are pre-sized and committed, served with plain `<img>` and explicit `width`/`height`.** Never `<Image>` for a local asset — the `@unpic/astro` service is pure-URL (`fallbackService: 'cloudflare'`) and would emit the original bytes untransformed.
- **The build stays offline-capable.** Nothing is fetched at build time.
- **Build output lives in `dist/client/`**, not `dist/`.

## Before You Start

The working tree is dirty on `main` — the earlier two-mode refactor plus the
`docs/agents/` files are uncommitted, and that refactor already touched
`os.astro`, `OS.astro`, `global.css` and `Desktop.astro`.

Those pre-existing changes must be committed **before** this work starts.
Otherwise the "`/os` is untouched" check in Task 9 compares against a `main`
that predates them and reports false positives on files this plan never opens.

```bash
git checkout -b profile-homepage
git add -A
git commit -m "feat: split the site into clean and desktop modes"
git tag profile-baseline
```

Task 9 diffs against `profile-baseline`, not `main`.

## File Structure

**Created**

| File | Responsibility |
| --- | --- |
| `public/avatar.webp` | 256×256 profile picture |
| `public/banner.webp` | 1440×360 desktop-screenshot cover |
| `src/layouts/Profile.astro` | Composes header + tabs + feed + rail over `Page.astro` |
| `src/components/profile/ProfileHeader.astro` | Banner, avatar, identity, counts, action buttons |
| `src/components/profile/TabBar.astro` | Sticky four-tab navigation |
| `src/components/profile/Rail.astro` | YUPCHA, Stack and Elsewhere cards |
| `src/components/profile/FeedItem.astro` | Generic feed row: avatar column, title, description, optional media |
| `src/components/profile/WorkFeed.astro` | `products` → `FeedItem` |
| `src/components/profile/WritingFeed.astro` | `blog` → `FeedItem` |
| `src/components/profile/LabFeed.astro` | `experiments` → `FeedItem` |
| `src/components/profile/MediaGrid.astro` | `gallery` → tile grid |
| `src/pages/lab.astro` | Experiments tab |
| `src/pages/media.astro` | Media tab |

**Modified**

| File | Change |
| --- | --- |
| `src/layouts/Page.astro` | Add a `wide` prop |
| `src/styles/page.css` | Append the profile section; delete the dead `.hero` / `.section` / `.rows` blocks in Task 9 |
| `src/pages/index.astro` | Becomes the Work tab |
| `src/pages/blog/index.astro` | Becomes the Writing tab |
| `src/components/page/Nav.astro` | Slimmed to brand + fun mode |
| `scripts/gen-og.mjs` | Two new OG cards |

**Deleted**

`src/components/page/Section.astro`, `WorkList.astro`, `PostList.astro`, `LinkList.astro`. `GalleryStrip.astro` **survives** — `src/pages/[slug].astro` still uses it.

---

### Task 1: Vendor the profile assets

The avatar is downloaded and resized once, then committed. Hotlinking GitHub would add an external request and a layout shift; fetching at build time would break offline builds.

**Files:**
- Create: `public/avatar.webp`
- Create: `public/banner.webp`

**Interfaces:**
- Consumes: nothing
- Produces: `/avatar.webp` (256×256) and `/banner.webp` (1440×360), both referenced by `ProfileHeader.astro` in Task 2

- [ ] **Step 1: Download and resize the avatar**

```bash
cd /Users/user4/Desktop/palash.dev
curl -sL https://github.com/debpalash.png -o /tmp/av.png
sips -Z 256 /tmp/av.png --out /tmp/av-256.png
cwebp -q 82 /tmp/av-256.png -o public/avatar.webp
```

- [ ] **Step 2: Crop the banner from the existing desktop screenshot**

`sips -c` takes **height then width** and crops from the centre.

```bash
sips -c 360 1440 docs/screenshot.png --out /tmp/banner.png
cwebp -q 78 /tmp/banner.png -o public/banner.webp
```

- [ ] **Step 3: Verify both assets**

```bash
file public/avatar.webp public/banner.webp
ls -lh public/avatar.webp public/banner.webp
```

Expected: avatar `256x256`, roughly 6K. Banner `1440x360`, roughly 32K. If either is over 100K, lower the `-q` value and redo.

- [ ] **Step 4: Look at the banner**

Open `public/banner.webp`. The centre crop must show recognisable desktop windows, not an empty stretch of wallpaper. If it is mostly background, re-crop from higher up:

```bash
sips -c 720 1440 docs/screenshot.png --out /tmp/top.png
sips -c 360 1440 /tmp/top.png --out /tmp/banner.png
cwebp -q 78 /tmp/banner.png -o public/banner.webp
```

- [ ] **Step 5: Commit**

```bash
git add public/avatar.webp public/banner.webp
git commit -m "feat(profile): vendor avatar and desktop-crop banner"
```

---

### Task 2: Profile shell — layout, header, tab bar

After this task `/` shows the profile header and tab bar with its existing content underneath. The old sections stay for now so the page never breaks; Task 4 replaces them.

**Files:**
- Modify: `src/layouts/Page.astro`
- Create: `src/layouts/Profile.astro`
- Create: `src/components/profile/ProfileHeader.astro`
- Create: `src/components/profile/TabBar.astro`
- Modify: `src/styles/page.css` (append)
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `/avatar.webp`, `/banner.webp` from Task 1
- Produces:
  - `Page.astro` prop `wide?: boolean`
  - `Profile.astro` props `{ title: string; description?: string; ogImage?: string; active: 'work' | 'writing' | 'lab' | 'media' }`, a default slot for feed content, a named `head` slot, and a named `rail` slot
  - CSS classes `.profile-grid`, `.profile-main`, `.rail`, `.phead*`, `.ptabs`, `.ptab`, `.pbtn*`

- [ ] **Step 1: Add the `wide` prop to `Page.astro`**

Replace the frontmatter interface and the `<main>` element:

```astro
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  /** narrower measure for long-form reading (blog posts, product pages) */
  narrow?: boolean;
  /** wider measure with no top padding — the profile pages supply their own */
  wide?: boolean;
}

const { title, description, ogImage, ogType, narrow = false, wide = false } = Astro.props;
```

```astro
<main id="main" class:list={['shell', narrow && 'shell-narrow', wide && 'shell-wide']}>
  <slot />
</main>
```

- [ ] **Step 2: Create `src/components/profile/TabBar.astro`**

```astro
---
/**
 * The four profile tabs. Each is a real route, so this is plain navigation —
 * no client state, no JS.
 */
interface Props {
  active: 'work' | 'writing' | 'lab' | 'media';
}

const { active } = Astro.props;

const tabs = [
  { key: 'work', href: '/', label: 'Work' },
  { key: 'writing', href: '/blog', label: 'Writing' },
  { key: 'lab', href: '/lab', label: 'Experiments' },
  { key: 'media', href: '/media', label: 'Media' },
] as const;
---

<nav class="ptabs" aria-label="Profile sections">
  {tabs.map((t) => (
    <a
      href={t.href}
      class:list={['ptab', t.key === active && 'is-active']}
      aria-current={t.key === active ? 'page' : undefined}
    >{t.label}</a>
  ))}
</nav>
```

- [ ] **Step 3: Create `src/components/profile/ProfileHeader.astro`**

It counts the collections itself so the four tab pages stay thin.

```astro
---
import { getCollection } from 'astro:content';
import { SITE } from '../../site.config';

const [products, posts, experiments] = await Promise.all([
  getCollection('products'),
  getCollection('blog', ({ data }) => !data.draft),
  getCollection('experiments'),
]);

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

const counts = [
  { href: '/', n: products.length, label: 'shipped' },
  { href: '/blog', n: posts.length, label: plural(posts.length, 'post') },
  { href: '/lab', n: experiments.length, label: plural(experiments.length, 'experiment') },
];
---

<header class="phead">
  <a
    class="phead-banner"
    href="/os"
    aria-label={`${SITE.osName} — the desktop version of this site`}
  >
    <img src="/banner.webp" alt="" width="1440" height="360" fetchpriority="high" />
  </a>

  <div class="phead-top">
    <img
      class="phead-avatar"
      src="/avatar.webp"
      alt={SITE.author}
      width="256"
      height="256"
      fetchpriority="high"
    />
    <div class="phead-actions">
      <a class="pbtn pbtn-primary" href="/rss.xml">RSS</a>
      <a class="pbtn pbtn-icon" href={`mailto:${SITE.email}`} aria-label={`Email ${SITE.author}`}>
        <span aria-hidden="true">✉</span>
      </a>
      <a class="pbtn pbtn-fun" href="/os">fun mode ↗</a>
    </div>
  </div>

  <h1 class="phead-name">{SITE.author}</h1>
  <p class="phead-handle mono">@{SITE.handle}</p>

  <p class="phead-bio">
    Engineer and product builder. Developer tools, media platforms and
    infrastructure — local-first where it counts, open source where it helps.
    Things that ship.
  </p>

  <p class="phead-meta mono">
    <span><span aria-hidden="true">📍</span> Agartala, India</span>
    <a href={SITE.github} target="_blank" rel="noopener">
      <span aria-hidden="true">🔗</span> github.com/{SITE.handle}
    </a>
    <span><span aria-hidden="true">⌨</span> {SITE.stack.slice(0, 3).join(' · ')}</span>
  </p>

  <p class="phead-counts">
    {counts.map((c) => (
      <a href={c.href}><strong>{c.n}</strong> {c.label}</a>
    ))}
  </p>
</header>
```

- [ ] **Step 4: Create `src/layouts/Profile.astro`**

```astro
---
/**
 * The profile shell shared by /, /blog, /lab and /media.
 *
 * Header and tabs sit in the left column above the feed, with the rail
 * beside them — the desktop Twitter arrangement.
 */
import Page from './Page.astro';
import ProfileHeader from '../components/profile/ProfileHeader.astro';
import TabBar from '../components/profile/TabBar.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  active: 'work' | 'writing' | 'lab' | 'media';
}

const { title, description, ogImage, active } = Astro.props;
---

<Page title={title} description={description} ogImage={ogImage} wide>
  <slot name="head" slot="head" />

  <div class="profile-grid">
    <div class="profile-main">
      <ProfileHeader />
      <TabBar active={active} />
      <div class="feed"><slot /></div>
    </div>
    <aside class="rail"><slot name="rail" /></aside>
  </div>
</Page>
```

- [ ] **Step 5: Append the profile styles to `src/styles/page.css`**

Add at the end of the file. `main.shell-wide` must come after the existing `main.shell` rule — same specificity, so source order decides.

```css
/* ------------------------------------------------------------- profile */

:root {
  --feed-w: 600px;
  --rail-w: 320px;
  --col-gap: 2rem;
  --banner-h: 200px;
  --avatar: 128px;
  --tab-h: 3rem;
}

main.shell-wide {
  max-width: 64rem;
  padding-top: 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, var(--feed-w)) var(--rail-w);
  gap: var(--col-gap);
  justify-content: center;
}

.profile-main,
.rail {
  min-width: 0;
}

/* --- header --- */

.phead-banner {
  display: block;
  position: relative;
  height: var(--banner-h);
  overflow: hidden;
  background: linear-gradient(120deg, var(--bg-inset), var(--bg-subtle));
}

.phead-banner img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
}

/* keeps the name legible whatever the crop happens to contain */
.phead-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 45%,
    color-mix(in srgb, var(--bg) 65%, transparent)
  );
}

.phead-banner:hover img {
  opacity: 0.88;
}

.phead-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: calc(var(--avatar) / -2);
}

.phead-avatar {
  display: block;
  width: var(--avatar);
  height: var(--avatar);
  border-radius: 50%;
  border: 4px solid var(--bg);
  background: var(--bg);
}

.phead-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.35rem;
}

.pbtn {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.4;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  color: var(--text-muted);
  white-space: nowrap;
}

.pbtn:hover {
  border-color: var(--accent);
  color: var(--accent);
  text-decoration: none;
}

.pbtn-primary {
  background: var(--text);
  border-color: var(--text);
  color: var(--bg);
}

.pbtn-primary:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.pbtn-icon {
  padding: 0.4rem 0.7rem;
}

.phead-name {
  margin-top: 0.9rem;
  font-size: 1.55rem;
  font-weight: 680;
  letter-spacing: -0.03em;
}

.phead-handle {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.phead-bio {
  margin-top: 0.85rem;
  max-width: 60ch;
}

.phead-meta {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.1rem;
  font-size: 0.78rem;
  color: var(--text-faint);
}

.phead-meta a {
  color: var(--text-faint);
}

.phead-meta a:hover {
  color: var(--accent);
}

.phead-counts {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.25rem;
  font-size: 0.9rem;
}

.phead-counts a {
  color: var(--text-muted);
}

.phead-counts a:hover {
  color: var(--text);
  text-decoration: none;
}

.phead-counts strong {
  color: var(--text);
  font-weight: 640;
}

/* --- tabs --- */

.ptabs {
  position: sticky;
  top: var(--nav-h);
  z-index: 15;
  display: flex;
  margin-top: 1.25rem;
  overflow-x: auto;
  scrollbar-width: none;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.ptabs::-webkit-scrollbar {
  display: none;
}

.ptab {
  flex: 1 0 auto;
  min-width: 5.5rem;
  height: var(--tab-h);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.92rem;
  color: var(--text-muted);
  border-bottom: 3px solid transparent;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.ptab:hover {
  background: var(--bg-inset);
  color: var(--text);
  text-decoration: none;
}

.ptab.is-active {
  color: var(--text);
  font-weight: 620;
  border-bottom-color: var(--accent);
}
```

- [ ] **Step 6: Switch `/` to the profile shell**

In `src/pages/index.astro`, change the layout import and the wrapping element. Leave the frontmatter and the existing `<Section>` blocks exactly as they are — Task 4 replaces them.

```astro
import Profile from '../layouts/Profile.astro';
```

```astro
<Profile title={SITE.title} description={SITE.description} active="work">
```

and the closing tag to `</Profile>`.

- [ ] **Step 7: Build and verify**

```bash
cd /Users/user4/Desktop/palash.dev && bun run build 2>&1 | tail -5
grep -c 'phead-banner' dist/client/index.html
grep -c 'aria-label="Profile sections"' dist/client/index.html
grep -c '<script' dist/client/index.html
```

Expected: build succeeds; first two greps return `1`; script count is `2`.

- [ ] **Step 8: Screenshot and look at it**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
cd /Users/user4/Desktop/palash.dev/dist/client && python3 -m http.server 4599 &
sleep 1
"$CHROME" --headless --disable-gpu --window-size=1440,1600 \
  --screenshot=/tmp/profile-home.png http://localhost:4599/
```

Open `/tmp/profile-home.png`. The avatar must overlap the banner by half, the action buttons must sit level with the avatar's bottom edge, and the tab bar must sit directly under the header with `Work` underlined.

- [ ] **Step 9: Commit**

```bash
git add src/layouts/Page.astro src/layouts/Profile.astro \
  src/components/profile/ src/styles/page.css src/pages/index.astro
git commit -m "feat(profile): add profile shell with header and tab bar"
```

---

### Task 3: The right rail

**Files:**
- Create: `src/components/profile/Rail.astro`
- Modify: `src/styles/page.css` (append)
- Modify: `src/layouts/Profile.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Profile.astro`'s `rail` slot from Task 2
- Produces: `Rail.astro`, taking no props; CSS classes `.rail-cards`, `.rcard`, `.chip`

- [ ] **Step 1: Create `src/components/profile/Rail.astro`**

```astro
---
/**
 * The sticky rail — company, stack and contact. This is where YUPCHA lives
 * now; it used to be a section you scrolled past.
 */
import { getCollection } from 'astro:content';
import { SITE } from '../../site.config';

const company = await getCollection('company');

/** the self-link is redundant in a list of ways to reach the site you're on */
const links = SITE.links.filter((l) => l.href !== SITE.url);
---

<div class="rail-cards">
  <section class="rcard">
    <h2 class="rcard-title">{SITE.company.name}</h2>
    <p class="rcard-text">{SITE.company.blurb}</p>
    <ul class="rcard-list">
      {company.map((c) => (
        <li>
          <a href={c.data.url} target="_blank" rel="noopener">{c.data.name}</a>
          <span class="mono muted"> {c.data.lang}</span>
        </li>
      ))}
    </ul>
    <a class="rcard-more mono" href={SITE.company.url} target="_blank" rel="noopener">
      {SITE.company.url.replace('https://', '')} ↗
    </a>
  </section>

  <section class="rcard">
    <h2 class="rcard-title">Stack</h2>
    <p class="rcard-chips">
      {SITE.stack.map((s) => <span class="chip mono">{s}</span>)}
    </p>
  </section>

  <section class="rcard">
    <h2 class="rcard-title">Elsewhere</h2>
    <ul class="rcard-list">
      {links.map((l) => (
        <li>
          <a
            href={l.href}
            target={l.href.startsWith('http') ? '_blank' : undefined}
            rel={l.href.startsWith('http') ? 'noopener' : undefined}
          >{l.label}</a>
        </li>
      ))}
    </ul>
  </section>
</div>
```

- [ ] **Step 2: Render it by default in `Profile.astro`**

Every tab wants the same rail, so make it the slot's fallback rather than repeating it on four pages. Add the import:

```astro
import Rail from '../components/profile/Rail.astro';
```

and change the aside:

```astro
<aside class="rail"><slot name="rail"><Rail /></slot></aside>
```

- [ ] **Step 3: Append the rail styles to `src/styles/page.css`**

```css
/* --- rail --- */

.rail-cards {
  position: sticky;
  top: calc(var(--nav-h) + var(--tab-h) + 1rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: var(--banner-h);
}

.rcard {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem 1.1rem;
}

.rcard-title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.rcard-text {
  margin-top: 0.6rem;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.rcard-list {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.88rem;
}

.rcard-list li + li {
  margin-top: 0.5rem;
}

.rcard-list a {
  color: var(--text);
}

.rcard-list a:hover {
  color: var(--accent);
}

.rcard-more {
  display: inline-block;
  margin-top: 0.85rem;
  font-size: 0.8rem;
}

.rcard-chips {
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-muted);
}
```

The `padding-top: var(--banner-h)` drops the first card level with the avatar rather than the banner's top edge.

- [ ] **Step 4: Remove the Company section from `/`**

In `src/pages/index.astro`, delete the entire `<Section id="company">…</Section>` block and the now-unused `companyProjects` constant in the frontmatter. Leave the `LinkList` import — the Experiments section still uses it until Task 4.

- [ ] **Step 5: Build and verify**

```bash
cd /Users/user4/Desktop/palash.dev && bun run build 2>&1 | tail -5
grep -c 'rail-cards' dist/client/index.html
grep -c 'YUPCHA' dist/client/index.html
grep -c 'id="company"' dist/client/index.html
```

Expected: build succeeds; `rail-cards` returns `1`; `YUPCHA` is at least `1`; `id="company"` returns `0`.

- [ ] **Step 6: Screenshot at 1440 and confirm the two-column layout**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
cd /Users/user4/Desktop/palash.dev/dist/client && python3 -m http.server 4599 &
sleep 1
"$CHROME" --headless --disable-gpu --window-size=1440,1800 \
  --screenshot=/tmp/profile-rail.png http://localhost:4599/
```

The three rail cards must sit to the right of the feed, with the first card's top roughly level with the avatar.

- [ ] **Step 7: Commit**

```bash
git add src/components/profile/Rail.astro src/layouts/Profile.astro \
  src/styles/page.css src/pages/index.astro
git commit -m "feat(profile): add sticky rail with company, stack and links"
```

---

### Task 4: Feed rows and the Work tab

**Files:**
- Create: `src/components/profile/FeedItem.astro`
- Create: `src/components/profile/WorkFeed.astro`
- Modify: `src/styles/page.css` (append)
- Modify: `src/pages/index.astro`
- Delete: `src/components/page/Section.astro`, `src/components/page/WorkList.astro`, `src/components/page/LinkList.astro`

**Interfaces:**
- Consumes: `Profile.astro` default slot from Task 2
- Produces:
  - `FeedItem.astro` props `{ href: string; title: string; meta?: string; external?: boolean; icon?: string; logoUrl?: string; image?: string; imageAlt?: string }` plus a default slot for the description. Used by Tasks 5 and 6.
  - `WorkFeed.astro` props `{ products: CollectionEntry<'products'>[]; gallery: CollectionEntry<'gallery'>[] }`
  - CSS classes `.feed-list`, `.fitem*`, `.feed-empty`

- [ ] **Step 1: Create `src/components/profile/FeedItem.astro`**

Everything is a `<span>` because the whole row is one `<a>`; `display: block` on the spans gives the layout without nesting block elements inside a link.

```astro
---
/**
 * One row in a feed. Name, one line, and optionally an attached screenshot.
 * Deliberately no stars, downloads, status chips or stack tags — those live
 * on the detail page.
 */
interface Props {
  href: string;
  title: string;
  /** @slug for a product, a date for a post, a language for an experiment */
  meta?: string;
  external?: boolean;
  icon?: string;
  logoUrl?: string;
  image?: string;
  imageAlt?: string;
}

const {
  href,
  title,
  meta,
  external = false,
  icon = '►',
  logoUrl,
  image,
  imageAlt,
} = Astro.props;
---

<a
  class="fitem"
  href={href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener' : undefined}
>
  <span class="fitem-avatar" aria-hidden="true">
    {logoUrl ? (
      <img src={logoUrl} alt="" width="40" height="40" loading="lazy" />
    ) : (
      <span>{icon}</span>
    )}
  </span>

  <span class="fitem-body">
    <span class="fitem-head">
      <strong class="fitem-title">{title}</strong>
      {meta && <span class="fitem-meta mono">{meta}</span>}
      {external && <span class="fitem-meta" aria-hidden="true">↗</span>}
    </span>

    <span class="fitem-desc"><slot /></span>

    {image && (
      <span class="fitem-media">
        <img src={image} alt={imageAlt ?? ''} loading="lazy" decoding="async" />
      </span>
    )}
  </span>
</a>
```

- [ ] **Step 2: Create `src/components/profile/WorkFeed.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import FeedItem from './FeedItem.astro';

interface Props {
  products: CollectionEntry<'products'>[];
  gallery: CollectionEntry<'gallery'>[];
}

const { products, gallery } = Astro.props;

/** first screenshot of each product, attached to its row like a media post */
const shotFor = (id: string) => gallery.find((g) => g.data.group === id);
---

<div class="feed-list">
  {products.map((p) => {
    const shot = shotFor(p.id);
    return (
      <FeedItem
        href={`/${p.id}`}
        title={p.data.name}
        meta={`@${p.id}`}
        icon={p.data.icon}
        logoUrl={p.data.logoUrl}
        image={shot?.data.src}
        imageAlt={shot?.data.title}
      >{p.data.tagline}</FeedItem>
    );
  })}
</div>
```

- [ ] **Step 3: Append the feed styles to `src/styles/page.css`**

```css
/* --- feed --- */

.feed-list {
  display: flex;
  flex-direction: column;
}

.fitem {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0.85rem;
  padding: 1.1rem 0.75rem;
  margin: 0 -0.75rem;
  border-radius: 10px;
  border-bottom: 1px solid var(--border);
  color: inherit;
  transition: background-color 0.14s ease;
}

.feed-list > .fitem:last-child {
  border-bottom: 0;
}

.fitem:hover {
  background: var(--bg-subtle);
  color: inherit;
  text-decoration: none;
}

@media (hover: none) {
  .fitem:hover {
    background: none;
  }
}

.fitem-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-inset);
  font-size: 1.05rem;
}

.fitem-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.fitem-body {
  display: block;
  min-width: 0;
}

.fitem-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.fitem-title {
  font-weight: 620;
  color: var(--text);
}

.fitem-meta {
  font-size: 0.78rem;
  color: var(--text-faint);
}

.fitem-desc {
  display: block;
  margin-top: 0.2rem;
  color: var(--text-muted);
}

.fitem-media {
  display: block;
  margin-top: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-inset);
}

.fitem-media img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.feed-empty {
  padding: 2.5rem 0.75rem;
  color: var(--text-faint);
}
```

- [ ] **Step 4: Rewrite `src/pages/index.astro` as the Work tab**

Keep the `jsonLd`, `homeKeywords` and `hashForward` constants **exactly as they are** — they are the site's canonical entity graph. Replace everything else.

```astro
---
import { getCollection } from 'astro:content';
import Profile from '../layouts/Profile.astro';
import WorkFeed from '../components/profile/WorkFeed.astro';
import { SITE } from '../site.config';

const products = (await getCollection('products')).sort(
  (a, b) => a.data.order - b.data.order,
);
const gallery = await getCollection('gallery');

// ... jsonLd, homeKeywords and hashForward unchanged ...
---

<Profile title={SITE.title} description={SITE.description} active="work">
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
    <meta name="keywords" content={homeKeywords} />
    <script is:inline set:html={hashForward} />
  </Fragment>

  {products.length > 0 ? (
    <WorkFeed products={products} gallery={gallery} />
  ) : (
    <p class="feed-empty">Nothing here yet.</p>
  )}
</Profile>
```

`homeKeywords` still references `products`, so keep that constant above it. The `posts`, `experiments`, `company`, `recentPosts`, `shots`, `companyProjects` and `experimentItems` constants are all gone.

- [ ] **Step 5: Delete the superseded components**

```bash
cd /Users/user4/Desktop/palash.dev
git rm src/components/page/Section.astro src/components/page/WorkList.astro \
  src/components/page/LinkList.astro
```

`PostList.astro` stays until Task 5. `GalleryStrip.astro` stays permanently.

- [ ] **Step 6: Build and verify**

```bash
bun run build 2>&1 | tail -5
grep -c 'class="fitem"' dist/client/index.html
grep -c 'fitem-media' dist/client/index.html
grep -c '<script' dist/client/index.html
grep -o '"@type":"Person"' dist/client/index.html | head -1
```

Expected: build succeeds; three `fitem` rows; at least one `fitem-media`; script count still `2`; the Person entity still present.

- [ ] **Step 7: Screenshot and check the rows**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
cd /Users/user4/Desktop/palash.dev/dist/client && python3 -m http.server 4599 &
sleep 1
"$CHROME" --headless --disable-gpu --window-size=1440,2000 \
  --screenshot=/tmp/profile-work.png http://localhost:4599/
```

Each row shows an icon, the name, `@slug`, one line of description, and a screenshot at 16/10. No status chips, no stack tags.

- [ ] **Step 8: Commit**

```bash
git add -A src/components src/pages/index.astro src/styles/page.css
git commit -m "feat(profile): turn / into the Work tab with post-style rows"
```

---

### Task 5: The Writing tab

**Files:**
- Create: `src/components/profile/WritingFeed.astro`
- Modify: `src/pages/blog/index.astro`
- Delete: `src/components/page/PostList.astro`

**Interfaces:**
- Consumes: `FeedItem.astro` from Task 4
- Produces: `WritingFeed.astro` props `{ posts: CollectionEntry<'blog'>[] }`

- [ ] **Step 1: Create `src/components/profile/WritingFeed.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import FeedItem from './FeedItem.astro';

interface Props {
  posts: CollectionEntry<'blog'>[];
}

const { posts } = Astro.props;

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
---

<div class="feed-list">
  {posts.map((post) => (
    <FeedItem
      href={`/blog/${post.id}`}
      title={post.data.title}
      meta={fmt(post.data.publishDate)}
      icon="✎"
    >{post.data.description}</FeedItem>
  ))}
</div>
```

- [ ] **Step 2: Rewrite `src/pages/blog/index.astro`**

Keep the `jsonLd` constant exactly as it is. Replace the layout and body — the "The Log" hero goes, replaced by the profile header.

```astro
---
import { getCollection } from 'astro:content';
import Profile from '../../layouts/Profile.astro';
import WritingFeed from '../../components/profile/WritingFeed.astro';
import { SITE } from '../../site.config';

const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

// ... jsonLd unchanged ...
---

<Profile
  title="The Log — writing on engineering & shipping"
  description="Notes on engineering, shipping, and building in public — by Palash Debnath. Updated often."
  ogImage="/og/blog.png"
  active="writing"
>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
  </Fragment>

  {allPosts.length > 0 ? (
    <WritingFeed posts={allPosts} />
  ) : (
    <p class="feed-empty">Nothing here yet.</p>
  )}
</Profile>
```

- [ ] **Step 3: Delete `PostList.astro`**

```bash
cd /Users/user4/Desktop/palash.dev && git rm src/components/page/PostList.astro
```

- [ ] **Step 4: Build and verify**

```bash
bun run build 2>&1 | tail -5
grep -c 'class="fitem"' dist/client/blog/index.html
grep -c 'aria-current="page"' dist/client/blog/index.html
grep -c '<script' dist/client/blog/index.html
grep -c 'The Log</h1>' dist/client/blog/index.html
```

Expected: nine rows; one `aria-current`; script count `1`; the old `<h1>The Log</h1>` returns `0`.

- [ ] **Step 5: Confirm the Writing tab is the underlined one**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
cd /Users/user4/Desktop/palash.dev/dist/client && python3 -m http.server 4599 &
sleep 1
"$CHROME" --headless --disable-gpu --window-size=1440,2000 \
  --screenshot=/tmp/profile-writing.png http://localhost:4599/blog/
```

- [ ] **Step 6: Commit**

```bash
git add -A src/components src/pages/blog/index.astro
git commit -m "feat(profile): turn /blog into the Writing tab"
```

---

### Task 6: The Experiments tab

**Files:**
- Create: `src/components/profile/LabFeed.astro`
- Create: `src/pages/lab.astro`
- Modify: `scripts/gen-og.mjs`

**Interfaces:**
- Consumes: `FeedItem.astro` from Task 4
- Produces: `LabFeed.astro` props `{ items: CollectionEntry<'experiments'>[] }`; the route `/lab`; the OG card `/og/lab.png`

- [ ] **Step 1: Create `src/components/profile/LabFeed.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import FeedItem from './FeedItem.astro';

interface Props {
  items: CollectionEntry<'experiments'>[];
}

const { items } = Astro.props;
---

<div class="feed-list">
  {items.map((x) => (
    <FeedItem
      href={x.data.url}
      title={x.data.name}
      meta={x.data.lang}
      icon="◇"
      external
    >{x.data.description}</FeedItem>
  ))}
</div>
```

- [ ] **Step 2: Create `src/pages/lab.astro`**

A static route, so it beats `[slug].astro` in Astro's route precedence — the same mechanism `/os` already relies on.

```astro
---
import { getCollection } from 'astro:content';
import Profile from '../layouts/Profile.astro';
import LabFeed from '../components/profile/LabFeed.astro';
import { SITE } from '../site.config';

const experiments = await getCollection('experiments');

const labUrl = `${SITE.url}/lab`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${labUrl}#page`,
      url: labUrl,
      name: 'Experiments',
      description:
        'Spikes, prototypes and one-offs by Palash Debnath — all open source on GitHub.',
      isPartOf: { '@id': `${SITE.url}/#website` },
      about: { '@id': `${SITE.url}/#person` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Experiments', item: labUrl },
      ],
    },
  ],
};
---

<Profile
  title="Experiments — spikes, prototypes and one-offs"
  description="Smaller things by Palash Debnath — spikes, prototypes and one-offs, all open source on GitHub."
  ogImage="/og/lab.png"
  active="lab"
>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
  </Fragment>

  {experiments.length > 0 ? (
    <LabFeed items={experiments} />
  ) : (
    <p class="feed-empty">Nothing here yet.</p>
  )}
</Profile>
```

- [ ] **Step 3: Add the OG card**

In `scripts/gen-og.mjs`, insert immediately before the final `console.log('done.');`:

```js
// ---- the lab (experiments index) ----
await render(
  'lab',
  card({
    chrome: '~/experiments',
    kicker: '$ ls -1 ~/spikes',
    title: 'EXPERIMENTS',
    subtitle: 'Spikes, prototypes and one-offs. All open source.',
    metaLeft: 'github.com/debpalash',
    metaRight: 'palash.dev · Palash Debnath',
  }),
  fonts,
);
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/user4/Desktop/palash.dev && bun run build 2>&1 | tail -5
ls public/og/lab.png
grep -c 'class="fitem"' dist/client/lab/index.html
grep -c 'CollectionPage' dist/client/lab/index.html
grep -c '<script' dist/client/lab/index.html
grep -c 'target="_blank"' dist/client/lab/index.html
grep -c '/lab/' dist/client/sitemap-0.xml
```

Expected: `og/lab.png` exists; six rows; `CollectionPage` present; script count `1`; external links present; the route is in the sitemap.

- [ ] **Step 5: Commit**

```bash
git add -A src/components src/pages/lab.astro scripts/gen-og.mjs public/og
git commit -m "feat(profile): add the /lab experiments tab"
```

---

### Task 7: The Media tab

**Files:**
- Create: `src/components/profile/MediaGrid.astro`
- Create: `src/pages/media.astro`
- Modify: `src/styles/page.css` (append)
- Modify: `scripts/gen-og.mjs`

**Interfaces:**
- Consumes: `Profile.astro` from Task 2
- Produces: `MediaGrid.astro` props `{ items: CollectionEntry<'gallery'>[] }`; the route `/media`; the OG card `/og/media.png`; CSS classes `.mgrid`, `.mtile`

- [ ] **Step 1: Create `src/components/profile/MediaGrid.astro`**

A grid rather than a feed, matching how a real profile's Media tab behaves.

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  items: CollectionEntry<'gallery'>[];
}

const { items } = Astro.props;
---

<div class="mgrid">
  {items.map((item) => (
    <a class="mtile" href={`/${item.data.group}`} aria-label={item.data.title}>
      <img src={item.data.src} alt={item.data.title} loading="lazy" decoding="async" />
    </a>
  ))}
</div>
```

- [ ] **Step 2: Append the grid styles to `src/styles/page.css`**

```css
/* --- media grid --- */

.mgrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 1.25rem;
}

.mtile {
  display: block;
  overflow: hidden;
  border-radius: 4px;
  background: var(--bg-inset);
}

.mtile img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  transition: opacity 0.16s ease;
}

.mtile:hover img {
  opacity: 0.82;
}
```

- [ ] **Step 3: Create `src/pages/media.astro`**

Products are ordered first so the grid reads in the same order as the Work tab.

```astro
---
import { getCollection } from 'astro:content';
import Profile from '../layouts/Profile.astro';
import MediaGrid from '../components/profile/MediaGrid.astro';
import { SITE } from '../site.config';

const products = (await getCollection('products')).sort(
  (a, b) => a.data.order - b.data.order,
);
const gallery = await getCollection('gallery');

/** group the shots by product, in work-tab order */
const shots = products.flatMap((p) => gallery.filter((g) => g.data.group === p.id));

const mediaUrl = `${SITE.url}/media`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${mediaUrl}#page`,
      url: mediaUrl,
      name: 'Media',
      description: 'Screenshots from the tools and apps Palash Debnath builds.',
      isPartOf: { '@id': `${SITE.url}/#website` },
      about: { '@id': `${SITE.url}/#person` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Media', item: mediaUrl },
      ],
    },
  ],
};
---

<Profile
  title="Media — screenshots from the work"
  description="Screenshots from Opal, OmniVoice Studio and memxt — the tools Palash Debnath builds."
  ogImage="/og/media.png"
  active="media"
>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
  </Fragment>

  {shots.length > 0 ? (
    <MediaGrid items={shots} />
  ) : (
    <p class="feed-empty">Nothing here yet.</p>
  )}
</Profile>
```

- [ ] **Step 4: Add the OG card**

In `scripts/gen-og.mjs`, insert before the final `console.log('done.');`:

```js
// ---- media (screenshot gallery) ----
await render(
  'media',
  card({
    chrome: '~/screenshots',
    kicker: '$ open ~/shots/*.png',
    title: 'MEDIA',
    subtitle: 'Screenshots from Opal, OmniVoice Studio and memxt.',
    metaLeft: 'palash.dev/media',
    metaRight: 'palash.dev · Palash Debnath',
  }),
  fonts,
);
```

- [ ] **Step 5: Build and verify**

```bash
cd /Users/user4/Desktop/palash.dev && bun run build 2>&1 | tail -5
ls public/og/media.png
grep -c 'class="mtile"' dist/client/media/index.html
grep -c 'loading="lazy"' dist/client/media/index.html
grep -c '<script' dist/client/media/index.html
ls dist/client | wc -l
```

Expected: `og/media.png` exists; 23 tiles; 23 lazy images; script count `1`.

- [ ] **Step 6: Confirm the route count rose to 18**

```bash
bun run build 2>&1 | grep -iE '[0-9]+ page'
```

Expected: 18 pages, up from 16.

- [ ] **Step 7: Commit**

```bash
git add -A src/components src/pages/media.astro src/styles/page.css \
  scripts/gen-og.mjs public/og
git commit -m "feat(profile): add the /media screenshot tab"
```

---

### Task 8: Slim the nav

Three stacked navigation strips — nav, tab bar, then the feed — is one too many. The nav drops to the two things the tab bar cannot do: identify the site, and escape to `/os`.

**Files:**
- Modify: `src/components/page/Nav.astro`
- Modify: `src/styles/page.css`

**Interfaces:**
- Consumes: nothing
- Produces: nothing new; `.nav-hide-sm` becomes unused and its rule is removed

- [ ] **Step 1: Rewrite `src/components/page/Nav.astro`**

```astro
---
/**
 * Deliberately minimal. On profile pages the tab bar handles section
 * navigation; on detail pages the back-link does. All this needs to do is
 * identify the site and offer the way across to /os.
 */
import { SITE } from '../../site.config';
---

<header class="nav">
  <div class="shell nav-inner">
    <a href="/" class="nav-brand">
      <img src="/logo.svg" alt="" width="22" height="22" />
      <span>{SITE.name}</span>
    </a>
    <nav class="nav-links" aria-label="Site">
      <a href="/os" class="nav-fun" title="The retro desktop version of this site">
        fun mode ↗
      </a>
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Remove the now-dead `.nav-hide-sm` rule**

In `src/styles/page.css`, delete these three lines from inside the `@media (max-width: 640px)` block that follows `.nav-fun:hover`:

```css
  .nav-links .nav-hide-sm {
    display: none;
  }
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/user4/Desktop/palash.dev && bun run build 2>&1 | tail -5
grep -c 'nav-hide-sm' dist/client/index.html
grep -c 'nav-fun' dist/client/index.html
grep -o 'aria-label="Site"' dist/client/blog/hello-world/index.html
```

Expected: `nav-hide-sm` returns `0`; `nav-fun` is present; the slimmed nav reaches detail pages too.

- [ ] **Step 4: Commit**

```bash
git add src/components/page/Nav.astro src/styles/page.css
git commit -m "refactor(nav): slim to brand and mode toggle now tabs exist"
```

---

### Task 9: Responsive, dead CSS, and the full verification pass

**Files:**
- Modify: `src/styles/page.css`

**Interfaces:**
- Consumes: every class from Tasks 2–8
- Produces: the final stylesheet

- [ ] **Step 1: Append the responsive rules to `src/styles/page.css`**

```css
/* --- profile responsive --- */

@media (max-width: 1039px) {
  .profile-grid {
    grid-template-columns: minmax(0, var(--feed-w));
  }
  .rail-cards {
    position: static;
    padding-top: 0;
    margin-top: 2rem;
  }
}

@media (max-width: 767px) {
  :root {
    --banner-h: 120px;
    --avatar: 72px;
  }
  /* full-bleed banner, the way it behaves on a phone */
  .phead-banner {
    margin: 0 calc(var(--gutter) * -1);
  }
  .phead-name {
    font-size: 1.35rem;
  }
  .ptab {
    min-width: 4.75rem;
    font-size: 0.86rem;
  }
  .mgrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .pbtn {
    font-size: 0.72rem;
    padding: 0.35rem 0.6rem;
  }
  /* the mode toggle is still one tap away in the nav */
  .phead-actions .pbtn-fun {
    display: none;
  }
  .phead-counts {
    gap: 0.35rem 0.9rem;
    font-size: 0.85rem;
  }
}
```

The `:root` override inside the media query works because it has the same specificity as the base `:root` and comes later in the file.

- [ ] **Step 2: Delete the CSS the profile replaced**

These blocks in `src/styles/page.css` no longer have any consumer. Remove each in full, including its comment banner:

- the `/* ---- hero ---- */` banner and `.hero`, `.hero h1`, `.hero-role`, `.hero-blurb`, `.hero-meta`
- the `/* ---- section ---- */` banner and `.section`, `.section-head`, `.section-title`, `.section-more`, `.section-lede`
- the `/* ---- list ---- */` banner and `.rows`, `.row`, `.rows > .row:last-child`, `a.row:hover`, `.row-icon`, `.row-body`, `.row-title`, `.row-desc`, `.row-meta`, `.row-arrow`, `.row-date`, the `@media (hover: none)` block that targets `.row`, and the `@media (max-width: 640px)` block that targets `.row`

Keep `.tag`, `.status*`, `.gallery-strip`, `.shot*`, `.company-card`, `.article*`, `.prose*`, `.btn*`, `.notfound*` — the detail pages and 404 still use them.

- [ ] **Step 3: Confirm nothing still references the deleted classes**

```bash
cd /Users/user4/Desktop/palash.dev
grep -rn 'class="hero\|class="section\|class="rows\|class="row \|hero-blurb\|section-title' src/ || echo "CLEAN"
```

Expected: `CLEAN`. If anything matches, it is a page that was missed — fix it before continuing.

- [ ] **Step 4: Build and check the whole payload**

```bash
bun run build 2>&1 | tail -8
for f in index blog/index lab/index media/index; do
  echo "$f: $(grep -c '<script' dist/client/$f.html) scripts"
done
ls -lh dist/client/_astro/*.css
```

Expected: `/` reports 2 scripts, the other three report 1 each. The `Page` stylesheet stays under about 20K; the `os` stylesheet is unchanged at roughly 88K.

- [ ] **Step 5: Screenshot every tab at three widths, light and dark**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
cd /Users/user4/Desktop/palash.dev/dist/client && python3 -m http.server 4599 &
sleep 1
for route in "" blog lab media; do
  for w in 390 768 1440; do
    "$CHROME" --headless --disable-gpu --window-size=$w,1800 \
      --screenshot=/tmp/p-${route:-home}-$w.png http://localhost:4599/$route
  done
done
"$CHROME" --headless --disable-gpu --window-size=1440,1800 \
  --blink-settings=preferredColorScheme=1 \
  --screenshot=/tmp/p-home-dark.png http://localhost:4599/
```

Open all thirteen. Specifically check:
- At 390: the banner reaches both screen edges, tabs scroll rather than squash, the media grid is two columns.
- At 768: one column, rail cards below the feed.
- At 1440: two columns, rail sticky.
- Dark: the banner gradient still fades to the page background, chips stay readable.

- [ ] **Step 6: Confirm `/os` is untouched**

```bash
cd /Users/user4/Desktop/palash.dev
git diff --stat profile-baseline -- src/pages/os.astro src/layouts/OS.astro \
  src/styles/global.css src/components/os/
```

Expected: no output at all. If anything appears, revert those files.

- [ ] **Step 7: Confirm no new dependencies**

```bash
git diff profile-baseline -- package.json
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add src/styles/page.css
git commit -m "feat(profile): responsive rules and remove superseded CSS"
```

---

## Definition of Done

- [ ] `bun run build` succeeds and reports 18 pages
- [ ] `/` emits 2 script tags; `/blog`, `/lab`, `/media` emit 1 each
- [ ] All four tabs render correctly at 390, 768 and 1440, in light and dark
- [ ] `git diff profile-baseline` shows nothing under `src/components/os/`, `src/styles/global.css`, `src/pages/os.astro` or `src/layouts/OS.astro`
- [ ] `package.json` is unchanged
- [ ] No feed row shows a star count, download count, status chip or stack tag
- [ ] `/lab` and `/media` appear in `dist/client/sitemap-0.xml`
