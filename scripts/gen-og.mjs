/**
 * Generates per-page Open Graph cards (1200x630) into public/og/.
 *
 * Cards are rendered as a PALASH.OS window in the shaktimaan palette, so a
 * shared link looks like a screenshot of the site. Runs in plain Node (see
 * `bun run og`, and the `build` script) — satori turns text into paths, so the
 * PNG needs no fonts at raster time.
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(root, 'public/og');

// shaktimaan palette (src/styles/global.css)
const C = {
  bg0: '#190407',
  bg1: '#29080d',
  fg0: '#ffd24a',
  fg1: '#e3b332',
  fg2: '#b0763f',
  cyan: '#6ec8ff',
  amber: '#ff4433',
};

const fontFile = (w) =>
  path.join(root, `node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${w}-normal.woff`);

/** satori needs explicit flex; these helpers keep the tree readable */
const div = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });
const text = (style, content) => div({ ...style }, content);

function card({ chrome, kicker, title, subtitle, metaLeft, metaRight, titleSize = 62 }) {
  return div(
    {
      width: 1200,
      height: 630,
      flexDirection: 'column',
      backgroundColor: C.bg0,
      backgroundImage: `radial-gradient(circle at 50% 120%, #38090f 0%, ${C.bg0} 60%)`,
      padding: 44,
      fontFamily: 'IBM Plex Mono',
    },
    [
      // window frame
      div(
        {
          flexDirection: 'column',
          flexGrow: 1,
          border: `2px solid ${C.fg2}`,
          backgroundColor: 'rgba(25,4,7,0.72)',
        },
        [
          // title bar
          div(
            {
              backgroundColor: C.fg0,
              color: C.bg0,
              padding: '10px 18px',
              fontSize: 24,
              fontWeight: 700,
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            // ASCII / Latin-1 only — the embedded font subset has no box-drawing glyphs
            [text({}, chrome), text({ letterSpacing: 4 }, '_ [] ×')],
          ),
          // body
          div({ flexDirection: 'column', flexGrow: 1, padding: '40px 44px' }, [
            text({ color: C.fg2, fontSize: 26, marginBottom: 18 }, kicker),
            text(
              {
                color: C.fg0,
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: 20,
              },
              title,
            ),
            text({ color: C.fg1, fontSize: 28, lineHeight: 1.45, marginBottom: 'auto' }, subtitle),
            div({ justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }, [
              text({ color: C.cyan, fontSize: 22 }, metaLeft),
              text({ color: C.fg2, fontSize: 22 }, metaRight),
            ]),
          ]),
        ],
      ),
    ],
  );
}

/** trim to a sane length so the card never overflows */
const clamp = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

async function render(name, element, fonts) {
  const svg = await satori(element, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(path.join(OUT, `${name}.png`), png);
  console.log(`  og/${name}.png`);
}

/** minimal frontmatter reader for the fields we need */
function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[')) {
      out[kv[1]] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      out[kv[1]] = v.replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const fonts = [
  { name: 'IBM Plex Mono', data: await readFile(fontFile(400)), weight: 400, style: 'normal' },
  { name: 'IBM Plex Mono', data: await readFile(fontFile(700)), weight: 700, style: 'normal' },
];

await mkdir(OUT, { recursive: true });
console.log('generating OG cards…');

// ---- products ----
const prodDir = path.join(root, 'src/content/products');
for (const file of (await readdir(prodDir)).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(await readFile(path.join(prodDir, file), 'utf8'));
  const slug = file.replace(/\.json$/, '');
  await render(
    slug,
    card({
      chrome: `programs/${slug}.prg`,
      kicker: `$ run ${slug}.prg`,
      title: p.name,
      subtitle: clamp(p.tagline, 96),
      metaLeft: (p.stack || []).slice(0, 5).join(' · '),
      metaRight: `palash.dev · ${p.status}`,
      titleSize: p.name.length > 14 ? 56 : 68,
    }),
    fonts,
  );
}

// ---- blog posts ----
const blogDir = path.join(root, 'src/content/blog');
const posts = (await readdir(blogDir)).filter((f) => /\.mdx?$/.test(f));
let live = 0;
for (const file of posts) {
  const fm = frontmatter(await readFile(path.join(blogDir, file), 'utf8'));
  if (!fm || fm.draft === 'true') continue;
  live++;
  const slug = file.replace(/\.mdx?$/, '');
  const date = (fm.publishDate || '').split('T')[0];
  await render(
    `blog-${slug}`,
    card({
      chrome: `articles/${slug}.md`,
      kicker: '$ cat — THE LOG',
      title: clamp(fm.title || slug, 62),
      subtitle: clamp(fm.description || '', 150),
      metaLeft: (fm.tags || []).map((t) => `#${t}`).join(' '),
      metaRight: `${date} · Palash Debnath`,
      titleSize: (fm.title || '').length > 34 ? 46 : 56,
    }),
    fonts,
  );
}

// ---- the log (blog index) ----
await render(
  'blog',
  card({
    chrome: '~/articles',
    kicker: '$ tail -f /dev/thoughts',
    title: 'THE LOG',
    subtitle: 'Notes on engineering, shipping, and building in public.',
    metaLeft: `${live} articles · rss`,
    metaRight: 'palash.dev · Palash Debnath',
  }),
  fonts,
);

console.log('done.');
