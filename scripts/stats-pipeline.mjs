/**
 * Refreshes live GitHub numbers (stars, release download totals) into
 * src/generated/stats.json at build time, so every deploy ships current
 * counts without any runtime API calls.
 *
 * Resilient by design: network failure keeps the previous stats.json; a
 * missing file falls back to the hardcoded numbers in the content JSONs.
 * Skips the network entirely when the file is fresher than an hour (dev
 * restarts shouldn't burn API quota).
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outFile = path.join(root, 'src/generated/stats.json');
const MAX_AGE_MS = 60 * 60 * 1000;

// Unauthenticated GitHub API limits are tight (60/h/IP); borrow the gh
// CLI's token when the env doesn't provide one.
const token = process.env.GITHUB_TOKEN
  || (() => { try { return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } })();

const headers = {
  'User-Agent': 'palash.dev-build',
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const repoOf = (url) => url?.match(/github\.com\/([^/]+\/[^/#?]+)/)?.[1];

async function gh(pathName) {
  const res = await fetch(`https://api.github.com${pathName}`, { headers });
  if (!res.ok) throw new Error(`${pathName} -> ${res.status}`);
  return res.json();
}

async function repoStats(repo, registries = {}) {
  const info = await gh(`/repos/${repo}`);
  const breakdown = { releases: 0, dockerHub: 0, ghcr: 0 };
  try {
    const releases = await gh(`/repos/${repo}/releases?per_page=100`);
    breakdown.releases = releases.flatMap((r) => r.assets ?? []).reduce((s, a) => s + (a.download_count ?? 0), 0);
  } catch { /* releases stay 0 */ }
  // Docker Hub pulls — public JSON API
  if (registries.dockerHub) {
    try {
      const res = await fetch(`https://hub.docker.com/v2/repositories/${registries.dockerHub}/`, { headers: { 'User-Agent': headers['User-Agent'] } });
      if (res.ok) breakdown.dockerHub = (await res.json()).pull_count ?? 0;
    } catch { /* pulls stay 0 */ }
  }
  // GHCR has no counts API; the package page prints `Total downloads` + <h3 title="N">
  if (registries.ghcr) {
    try {
      const res = await fetch(registries.ghcr, { headers: { 'User-Agent': headers['User-Agent'] } });
      const match = (await res.text()).match(/Total downloads<\/span>\s*<h3 title="(\d+)"/);
      if (match) breakdown.ghcr = Number(match[1]);
    } catch { /* ghcr stays 0 */ }
  }
  return {
    stars: info.stargazers_count ?? 0,
    downloads: breakdown.releases + breakdown.dockerHub + breakdown.ghcr,
    breakdown,
  };
}

async function loadFallback() {
  const products = {};
  const prodDir = path.join(root, 'src/content/products');
  for (const file of (await readdir(prodDir)).filter((f) => f.endsWith('.json'))) {
    const p = JSON.parse(await readFile(path.join(prodDir, file), 'utf8'));
    products[file.replace(/\.json$/, '')] = { stars: p.stars ?? 0, downloads: 0 };
  }
  const experiments = {};
  for (const x of JSON.parse(await readFile(path.join(root, 'src/content/experiments.json'), 'utf8'))) {
    experiments[x.id] = { stars: x.stars ?? 0 };
  }
  return { products, experiments, fetchedAt: null };
}

/** single-flight across concurrent build environments */
let inflight = null;

export function refreshStats() {
  inflight ??= run().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function run() {
  const fresh = await stat(outFile).then((s) => Date.now() - s.mtimeMs < MAX_AGE_MS).catch(() => false);
  if (fresh) return;

  try {
  const stats = { products: {}, experiments: {}, fetchedAt: new Date().toISOString() };

  const prodDir = path.join(root, 'src/content/products');
  for (const file of (await readdir(prodDir)).filter((f) => f.endsWith('.json'))) {
    const p = JSON.parse(await readFile(path.join(prodDir, file), 'utf8'));
    const repo = repoOf(p.github ?? p.url);
    if (repo) stats.products[file.replace(/\.json$/, '')] = await repoStats(repo, p.registries ?? {});
  }

  for (const x of JSON.parse(await readFile(path.join(root, 'src/content/experiments.json'), 'utf8'))) {
    const repo = repoOf(x.url);
    if (repo) {
      const info = await gh(`/repos/${repo}`);
      stats.experiments[x.id] = { stars: info.stargazers_count ?? 0 };
    }
  }

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(stats, null, 2));
  console.log(
    `refresh-stats: ${Object.entries(stats.products).map(([k, v]) => `${k} ★${v.stars} ⇩${v.downloads}`).join(', ')}`,
  );
} catch (err) {
  const exists = await stat(outFile).then(() => true).catch(() => false);
  if (exists) {
    console.warn(`refresh-stats: fetch failed (${err.message}), keeping previous stats.json`);
  } else {
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, JSON.stringify(await loadFallback(), null, 2));
    console.warn(`refresh-stats: fetch failed (${err.message}), wrote fallback from content JSONs`);
    }
  }
}
