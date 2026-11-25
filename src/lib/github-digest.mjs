/**
 * Pure GitHub → site helpers shared by the build pipeline (Node) and the live
 * data Worker (Cloudflare). No Node APIs here.
 */
const USER_DOWNLOAD_ASSET = /\.(?:appimage|dmg|msi|exe|zip|deb|rpm|run|tar\.gz)$/i;

export function isUserDownloadAsset(name) {
  return typeof name === 'string' && USER_DOWNLOAD_ASSET.test(name.trim());
}

export function releaseDownloadCount(releases) {
  if (!Array.isArray(releases)) return 0;

  return releases
    .filter((release) => release?.draft === false && release?.prerelease === false)
    .flatMap((release) => release.assets ?? [])
    .filter((asset) => isUserDownloadAsset(asset?.name))
    .reduce((sum, asset) => {
      const count = asset?.download_count;
      return sum + (Number.isFinite(count) && count >= 0 ? count : 0);
    }, 0);
}

/** First sentence-ish of release notes as plain text, for a feed excerpt. */
export function releaseSummary(body, max = 180, skip = []) {
  const drop = new Set(skip.map((s) => String(s).toLowerCase()));
  const text = String(body ?? '')
    .replace(/\r/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .split('\n')
    .filter((line) => !/^\s*#{1,6}\s/.test(line))
    .map((line) => line.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|>\s?|\d+\.\s+)/, '').replace(/[*`]|~~/g, '').replace(/(^|\s)_([^_]+)_(?=[\s.,;:!?]|$)/g, '$1$2').trim())
    .filter((line) => line && !/^(?:full changelog|what's changed)/i.test(line))
    .filter((line) => !(line.length < 60 && /^[A-Z][\w ]{1,24}:\s*\S/.test(line)))
    .filter((line) => !drop.has(line.toLowerCase()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

const cleanInline = (s) => String(s)
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\s+by @[\w-]+ in https?:\/\/\S+/g, '')
  .replace(/https?:\/\/\S+/g, '')
  .replace(/[*`]|~~/g, '')
  .replace(/(^|\s)_([^_]+)_(?=[\s.,;:!?]|$)/g, '$1$2')
  .replace(/\s+/g, ' ')
  .trim();
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const isMeta = (s) => s.length < 60 && /^[A-Z][\w ]{1,24}:\s*\S/.test(s);

/**
 * A release card's content: a headline (the notes' bold lead, when there is
 * one) and up to `max` highlight points from bullets or the opening sentences.
 * Download tables, code, changelog links, and metadata lines are skipped.
 */
export function releaseDigest(body, max = 3) {
  const blocks = [];
  let current = null;
  const lines = String(body ?? '').replace(/\r/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').split('\n');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim() || /^\s*\|/.test(line) || /^\s*#{1,6}\s/.test(line)) { current = null; continue; }
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    if (bullet) { current = { item: true, text: bullet[1] }; blocks.push(current); continue; }
    if (current) { current.text += ` ${line.trim()}`; continue; }
    current = { item: false, text: line.trim() };
    blocks.push(current);
  }
  const kept = [];
  for (const block of blocks) {
    if (/^\*\*(?:download|downloads|upgrading|install|installation|checksums?|assets)\b/i.test(block.text)) break;
    const flat = cleanInline(block.text);
    if (!flat || isMeta(flat) || /^(?:full changelog|what's changed)/i.test(flat)) continue;
    kept.push({ ...block, flat, lead: block.text.match(/^\*\*([^*]+?)\*\*\s*(.*)$/s) });
  }
  const leadBlock = kept.find((b) => b.lead);
  const headline = leadBlock ? clip(cleanInline(leadBlock.lead[1]), 90) : '';
  const points = kept
    .filter((b) => b.item && b !== leadBlock)
    .map((b) => clip(b.lead ? cleanInline(b.lead[1]) : b.flat, 90));
  if (points.length < 2) {
    const prose = kept.filter((b) => !b.item).map((b) => (b === leadBlock ? cleanInline(b.lead[2]) : b.flat)).join(' ');
    for (const sentence of prose.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
      if (points.length >= max) break;
      if (sentence && !points.includes(sentence)) points.push(clip(sentence, 90));
    }
  }
  return { headline, points: points.slice(0, max) };
}

/** Published (non-draft) releases, newest first, trimmed for the home feed. */
export function recentReleases(releases, limit = 2) {
  if (!Array.isArray(releases)) return [];
  const published = releases.filter((r) => r && r.draft === false && r.published_at);
  // Automated pre-releases are noise next to real versions; keep them only when nothing is stable yet.
  const stable = published.filter((r) => !r.prerelease);
  return (stable.length ? stable : published)
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))
    .slice(0, limit)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      url: r.html_url,
      publishedAt: r.published_at,
      prerelease: Boolean(r.prerelease),
      summary: releaseSummary(r.body, 180, [r.name, r.tag_name, `${r.name ?? ''} ${r.tag_name}`.trim()]),
      ...releaseDigest(r.body),
    }));
}

/**
 * Public repos for the Lab: everything the profile owns except forks, archived
 * repos, the profile README repo, and repos already presented as products.
 */
export function selectLabRepos(repos, owner, excluded = []) {
  if (!Array.isArray(repos)) return [];
  const skip = new Set([owner, ...excluded].map((name) => String(name).toLowerCase()));
  return repos
    .filter((r) => r && !r.fork && !r.archived && !r.private && r.owner?.login?.toLowerCase() === owner.toLowerCase())
    .filter((r) => !skip.has(String(r.name).toLowerCase()) && !skip.has(String(r.full_name).toLowerCase()))
    .map((r) => ({
      id: r.name,
      name: r.name,
      description: r.description ?? '',
      url: r.html_url,
      lang: r.language ?? '',
      stars: r.stargazers_count ?? 0,
      pushedAt: r.pushed_at ?? null,
    }))
    .sort((a, b) => b.stars - a.stars || String(b.pushedAt).localeCompare(String(a.pushedAt)));
}
