/**
 * Serves the static site and one live endpoint: /api/live.json, a GitHub
 * snapshot (stars, downloads, latest release, Lab repos) cached at the edge,
 * so the site reflects new releases without a rebuild.
 * Optional secret: GITHUB_TOKEN (read-only, public repos) for higher rate limits.
 */
import { releaseDownloadCount, recentReleases, selectLabRepos } from '../src/lib/github-digest.mjs';

const TTL = 900;
const json = (body, status, cache) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
});

async function snapshot(origin, env) {
  const manifest = await (await env.ASSETS.fetch(new Request(`${origin}/live-manifest.json`))).json();
  const headers = { 'User-Agent': 'palash.dev-live', Accept: 'application/vnd.github+json' };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const gh = async (path) => {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  };
  const products = {};
  await Promise.all(manifest.products.map(async (p) => {
    const [info, releases] = await Promise.all([gh(`/repos/${p.repo}`), gh(`/repos/${p.repo}/releases?per_page=100`).catch(() => [])]);
    products[p.id] = {
      name: p.name, website: p.website, logoUrl: p.logoUrl,
      stars: info.stargazers_count ?? 0,
      downloads: releaseDownloadCount(releases),
      release: recentReleases(releases, 1)[0] ?? null,
    };
  }));
  const owned = await gh(`/users/${manifest.profile}/repos?type=owner&sort=pushed&per_page=100`);
  const repos = selectLabRepos(owned, manifest.profile, manifest.products.flatMap((p) => [p.repo, p.repo.split('/')[1]]));
  return { fetchedAt: new Date().toISOString(), products, repos };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/live.json') return env.ASSETS.fetch(request);
    const key = new Request(`${url.origin}/api/live.json`);
    const cached = await caches.default.match(key);
    if (cached) return cached;
    try {
      const res = json(await snapshot(url.origin, env), 200, `public, max-age=300, s-maxage=${TTL}`);
      ctx.waitUntil(caches.default.put(key, res.clone()));
      return res;
    } catch {
      return json({ error: 'unavailable' }, 502, 'no-store');
    }
  },
};
