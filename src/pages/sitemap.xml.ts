import type { APIRoute } from 'astro';

/** Conventional sitemap URL alias for crawlers and humans. */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://palash.dev';
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${origin}/sitemap-0.xml</loc></sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
