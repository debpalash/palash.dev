import type { APIHandler } from 'filesystem-routing/api';
import { posts, products } from '../lib/content';
import { SITE } from '../site.config';

/**
 * The sitemap urlset: lexicographic URL order, weights, and lastmod rules
 * carried over from the original @astrojs/sitemap output.
 */
export const GET: APIHandler = () => {
  const newestContentDate = [
    ...posts.map((p) => p.updatedDate ?? p.publishDate),
    ...products.map((p) => p.updatedDate).filter((d): d is Date => !!d),
  ].reduce((latest, date) => (date > latest ? date : latest), new Date(0));

  type Entry = { loc: string; lastmod?: Date; changefreq: string; priority: string };
  const entries: Entry[] = [
    { loc: '/', lastmod: newestContentDate, changefreq: 'weekly', priority: '1.0' },
    { loc: '/blog/', lastmod: newestContentDate, changefreq: 'weekly', priority: '0.8' },
    ...posts.map((post) => ({
      loc: `/blog/${post.id}/`,
      lastmod: post.updatedDate ?? post.publishDate,
      changefreq: 'monthly',
      priority: '0.8',
    })),
    { loc: '/contact/', changefreq: 'yearly', priority: '0.5' },
    { loc: '/lab/', changefreq: 'monthly', priority: '0.7' },
    { loc: '/media/', changefreq: 'monthly', priority: '0.7' },
    ...products.map((product) => ({
      loc: `/${product.id}/`,
      lastmod: product.updatedDate,
      changefreq: 'monthly',
      priority: '0.9',
    })),
  ];
  entries.sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    entries
      .map(
        (e) =>
          '<url>' +
          `<loc>${SITE.url}${e.loc}</loc>` +
          (e.lastmod && e.lastmod.valueOf() > 0 ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : '') +
          `<changefreq>${e.changefreq}</changefreq>` +
          `<priority>${e.priority}</priority>` +
          '</url>',
      )
      .join('') +
    '</urlset>';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
