import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve('dist');
async function walk(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter(f => f.endsWith('.html'));
assert(htmlFiles.length > 15, 'Expected portfolio and article pages');
const site = 'https://palash.dev';
for (const file of htmlFiles) {
  const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const label = message => `${route}: ${message}`;
  assert.equal($('head title').length, 1, label('one title'));
  assert.equal($('head meta[name=description]').length, 1, label('one description'));
  assert.equal($('html').attr('lang'), 'en', label('page language'));
  assert.equal($('head meta[charset]').attr('charset')?.toLowerCase(), 'utf-8', label('UTF-8 charset'));
  assert.match($('head meta[name=viewport]').attr('content') ?? '', /width=device-width/, label('responsive viewport'));
  assert.equal($('head meta[name=theme-color]').attr('content'), '#cad8ea', label('theme color'));
  assert.equal($('head link[rel=manifest]').attr('href'), '/site.webmanifest', label('web manifest'));
  assert.equal($('head link[rel=describedby][href="/llms.txt"]').length, 1, label('agent content index'));
  const title = $('head title').text().trim();
  const description = $('head meta[name=description]').attr('content')?.trim() ?? '';
  assert(title.length >= 10 && title.length <= 70, label(`useful title length (${title.length})`));
  assert(description.length >= 40 && description.length <= 170, label(`useful description length (${description.length})`));
  assert.equal($('head link[rel=canonical]').length, 1, label('one canonical'));
  assert.equal($('h1').length, 1, label('one primary heading'));
  assert($('link[rel=stylesheet]').toArray().every(node => $(node).attr('href')?.startsWith('/_astro/')), label('stylesheets are local build assets'));
  assert($('img[src]').toArray().every(node => $(node).attr('src')?.startsWith('/')), label('images are same-origin'));
  assert.equal($('[style]').length, 0, label('no inline styles'));
  assert.equal($('body > header').length, 1, label('site header'));
  assert.equal($('body > footer').length, 1, label('site footer'));
  assert.equal($('nav[aria-label="Products"] a').length, 6, label('six product links'));
  assert.equal($('head meta[property="og:url"]').attr('content'), $('link[rel=canonical]').attr('href'), label('canonical agrees with OG'));
  assert.equal($('head meta[property="og:title"]').attr('content'), title, label('Open Graph title agrees'));
  assert.equal($('head meta[property="og:description"]').attr('content'), description, label('Open Graph description agrees'));
  assert.equal($('head meta[property="og:image:width"]').attr('content'), '1200', label('Open Graph image width'));
  assert.equal($('head meta[property="og:image:height"]').attr('content'), '630', label('Open Graph image height'));
  assert.equal($('head meta[name="twitter:card"]').attr('content'), 'summary_large_image');
  assert.equal($('head script[type="application/ld+json"]').length, 1, label('one schema graph'));
  const graph = JSON.parse($('head script[type="application/ld+json"]').text());
  assert.equal(graph['@context'], 'https://schema.org');
  assert(graph['@graph'].some(n => n['@type'] === 'Person'));
  assert(graph['@graph'].some(n => n['@type'] === 'Organization'));
  assert(graph['@graph'].some(n => n['@type'] === 'ImageObject' && n.contentUrl && n.width === 1200 && n.height === 630));
  if (route.startsWith('/blog/') && route !== '/blog/') {
    assert(graph['@graph'].some(n => n['@type'] === 'BlogPosting' && n.datePublished && n.author));
    assert($('link[rel=alternate][type="text/markdown"]').length >= 1);
  }
  const app = graph['@graph'].find(n => n['@type'] === 'SoftwareApplication');
  if (app) {
    assert(app.keywords?.length, label('software schema keywords'));
    assert.match($('link[rel=alternate][type="text/markdown"]').attr('href') ?? '', /\.md$/, label('product Markdown alternate'));
    assert(graph['@graph'].some(n => n['@type'] === 'SoftwareSourceCode' && n.codeRepository), label('open-source code schema'));
  }
  if (['/preview/', '/search/', '/404.html'].includes(route)) assert.match($('meta[name=robots]').attr('content'), /noindex/);
  else assert.equal($('link[rel=canonical]').attr('href'), site + route);
  if (route === '/') assert.equal($('link[rel=preload][as=image]').attr('fetchpriority'), 'high', label('high-priority LCP preload'));
  const og = new URL($('meta[property="og:image"]').attr('content'));
  const png = await readFile(path.join(root, og.pathname));
  assert.equal(png.readUInt32BE(16), 1200, label('OG width'));
  assert.equal(png.readUInt32BE(20), 630, label('OG height'));
  for (const el of $('a[href], img[src], script[src], link[href]').toArray()) {
    const target = $(el).attr('href') ?? $(el).attr('src');
    const url = new URL(target, site + route);
    if (url.origin !== site) continue;
    let local = path.join(root, decodeURIComponent(url.pathname));
    try { if ((await stat(local)).isDirectory()) local = path.join(local, 'index.html'); await stat(local); }
    catch { assert.fail(label(`missing local asset/link: ${target}`)); }
    if (url.hash && local.endsWith('.html')) {
      const other = load(await readFile(local, 'utf8'));
      assert(other('[id]').toArray().some(n => other(n).attr('id') === decodeURIComponent(url.hash.slice(1))), label(`missing anchor ${target}`));
    }
  }
  const interactiveRoutes = ['/search/', '/preview/', '/media/', '/bootable/', '/friday/', '/memxt/', '/omnivoice/', '/opal/', '/opengtm/'];
  if (!interactiveRoutes.includes(route)) assert.equal($('astro-island').length, 0, label('no framework hydration on static reading pages'));
  if (route !== '/preview/') assert(Buffer.byteLength(html) < 64 * 1024, label(`HTML performance budget (${Buffer.byteLength(html)} bytes)`));
}
assert(!files.some(file => /\.(?:woff2?|ttf|otf)$/.test(file)), 'production bundle has no webfont downloads');
assert((await stat(path.join(root, 'projects/voicestudio-voice-cloning.webp'))).size < 40 * 1024, 'homepage hero stays below 40 KiB');
assert((await stat(path.join(root, 'backdrop.svg'))).size < 24 * 1024, 'backdrop SVG stays minified');
const sitemap = await readFile(path.join(root, 'sitemap-0.xml'), 'utf8');
assert(!sitemap.includes('/preview/') && !sitemap.includes('/search/'));
for (const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) await stat(path.join(root, new URL(match[1]).pathname, 'index.html'));
const sitemapIndex = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.match(sitemapIndex, /<lastmod>[^<]+<\/lastmod>/, 'sitemap index includes last modification time');
const rss = await readFile(path.join(root, 'rss.xml'), 'utf8');
assert(rss.includes('rel="self" type="application/rss+xml"'), 'RSS advertises its canonical feed URL');
assert((await readFile(path.join(root, 'resume.pdf'))).subarray(0, 5).equals(Buffer.from('%PDF-')));
const llms = await readFile(path.join(root, 'llms.txt'), 'utf8');
assert(llms.includes('Bootable'));
assert.match(llms, /\]\(https:\/\/palash\.dev\/bootable\.md\)/, 'llms.txt links to product Markdown');
const headers = await readFile(path.join(root, '_headers'), 'utf8');
assert(headers.includes('/llms.txt') && headers.includes('X-Robots-Tag: noindex, follow'), 'machine-readable mirrors have crawl headers');
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${site}/sitemap.xml`), 'robots.txt advertises the sitemap');
assert(robots.includes('User-agent: OAI-SearchBot') && robots.includes('User-agent: Claude-SearchBot'), 'robots.txt explicitly allows AI search crawlers');
assert(await stat(path.join(root, 'site.webmanifest')), 'web manifest is built');
console.log(`OpenSEO-style audit passed for ${htmlFiles.length} pages: metadata, entity and source schema, social cards, crawl paths, local assets, performance budgets, Markdown mirrors, feeds, sitemap, and résumé.`);
