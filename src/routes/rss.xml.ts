import type { APIHandler } from 'filesystem-routing/api';
import { posts } from '../lib/content';
import { SITE } from '../site.config';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** RSS 2.0 feed — same element order and formatting as the @astrojs/rss output. */
export const GET: APIHandler = () => {
  const items = posts
    .map((post) => {
      const link = `${SITE.url}/blog/${post.id}/`;
      return [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="true">${link}</guid>`,
        `<description>${escapeXml(post.description)}</description>`,
        `<pubDate>${post.publishDate.toUTCString()}</pubDate>`,
        ...post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`),
        `<author>${SITE.author} (${SITE.email})</author>`,
        '</item>',
      ].join('');
    })
    .join('');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    `<title>${escapeXml('Palash Debnath — The Log')}</title>`,
    `<description>${escapeXml('Engineering, product, AI, and open-source notes from Palash Debnath.')}</description>`,
    `<link>${SITE.url}/</link>`,
    '<language>en-us</language>',
    `<copyright>© ${SITE.author}</copyright>`,
    `<managingEditor>${SITE.email} (${SITE.author})</managingEditor>`,
    `<webMaster>${SITE.email} (${SITE.author})</webMaster>`,
    '<ttl>60</ttl>',
    // newest content date, not request time — deterministic and cache-friendly
    `<lastBuildDate>${posts
      .map((p) => p.updatedDate ?? p.publishDate)
      .reduce((a, b) => (b > a ? b : a), new Date(0))
      .toUTCString()}</lastBuildDate>`,
    items,
    '</channel></rss>',
  ].join('');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
