import type { APIRoute } from 'astro';
import { SITE } from '../site.config';
import { posts, products } from '../lib/content';

/** Conventional sitemap URL alias for crawlers and humans. */
export const GET: APIRoute = () => {
  const lastModified = [
    ...posts.map(post => post.updatedDate ?? post.publishDate),
    ...products.map(product => product.updatedDate).filter((date): date is Date => !!date),
  ].reduce((latest, date) => date > latest ? date : latest, new Date(0));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE.url}/sitemap-0.xml</loc><lastmod>${lastModified.toISOString()}</lastmod></sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
