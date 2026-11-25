import { getCollection } from 'astro:content';
import experimentsJson from '../content/experiments.json';
import companyJson from '../content/company.json';
import statsJson from '../generated/stats.json';

type Stats = {
  products: Record<string, { stars?: number; downloads?: number } | undefined>;
  experiments: Record<string, { stars?: number } | undefined>;
  repos?: { id: string; name: string; description: string; url: string; lang: string; stars: number }[];
  releases?: { product: string; tag: string; name: string; url: string; publishedAt: string; prerelease: boolean; summary: string; headline?: string; points?: string[] }[];
};
const stats = statsJson as Stats;
export const products = (await getCollection('products')).map(({ id, data }) => ({
  ...data, id,
  stars: stats.products[id]?.stars ?? data.stars,
  downloads: stats.products[id]?.downloads || undefined,
})).sort((a, b) => a.order - b.order);
export type Product = typeof products[number];
export const productById = (id: string) => products.find(p => p.id === id);

export const blogEntries = (await getCollection('blog'))
  .filter(p => !p.data.draft && p.data.publishDate <= new Date())
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
export const posts = blogEntries.map(p => ({
  ...p.data, id: p.id, body: p.body ?? '',
  wordCount: (p.body ?? '').split(/\s+/).filter(Boolean).length,
})).map(p => ({ ...p, readMinutes: Math.max(1, Math.ceil(p.wordCount / 220)) }));
export const authorshipLabel = { human: 'Human-written', 'ai-assisted': 'AI-assisted', ai: 'AI-written' } as const;
export type Post = typeof posts[number];
export const postById = (id: string) => posts.find(p => p.id === id);
export const gallery = (await getCollection('gallery')).map(({ id, data }) => ({ id, ...data }));
export type GalleryShot = typeof gallery[number];
// Lab: every public profile repo that isn't a product (from the build-time GitHub fetch).
// Curated experiments.json entries supply descriptions and act as the offline fallback.
const curated = new Map(experimentsJson.map(x => [x.id.toLowerCase(), x]));
export const experiments = stats.repos?.length
  ? stats.repos.map(r => {
      const note = curated.get(r.id.toLowerCase());
      return { id: r.id, name: r.name, url: r.url, lang: r.lang || note?.lang || '', stars: r.stars, description: note?.description || r.description };
    })
  : experimentsJson.map(x => ({ ...x, stars: stats.experiments[x.id]?.stars ?? x.stars }))
      .sort((a, b) => a.id.localeCompare(b.id));
export const company = companyJson;
// Each product's latest release (build-time GitHub fetch), newest first.
export const releases = (stats.releases ?? []).flatMap(r => {
  const product = products.find(p => p.id === r.product);
  if (!product) return [];
  // Keep only the words a release title adds beyond its tag and product name.
  const base = product.name.replace(/\.\w+$/, '');
  const title = r.name.replace(r.tag, '').replace(new RegExp(`\\b${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '')
    .replace(/^[\s—–:|-]+|[\s—–:|-]+$/g, '').trim();
  // Card copy: the release title (or the notes' bold lead) plus up to three highlights.
  const headline = r.headline ?? '';
  const cardTitle = title || headline;
  const cardPoints = (title && headline ? [headline, ...(r.points ?? [])] : r.points ?? []).slice(0, 3);
  return [{ ...r, product, title, cardTitle, cardPoints, date: new Date(r.publishedAt) }];
});
export const latestRelease = (productId: string) => releases.find(r => r.product.id === productId);
export const totalDownloads = products.reduce((sum, p) => sum + (p.downloads ?? 0), 0);
export const featuredProduct = products.find(p => p.featured) ?? products[0];
export const totalStars = products.reduce((sum, p) => sum + (p.stars ?? 0), 0)
  + experiments.reduce((sum, p) => sum + p.stars, 0);
