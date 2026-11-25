import type { APIRoute } from 'astro';
import { products } from '../lib/content';

// Tells the live-data Worker which repos to watch; regenerated on every build.
const repoOf = (url?: string) => url?.match(/github\.com\/([^/]+\/[^/#?]+)/)?.[1];

export const GET: APIRoute = () => new Response(JSON.stringify({
  profile: 'debpalash',
  products: products.flatMap(p => {
    const repo = repoOf(p.github ?? p.url);
    return repo ? [{ id: p.id, name: p.name, repo, website: p.website ?? null, logoUrl: p.logoUrl ?? null }] : [];
  }),
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
