import type { APIHandler } from 'filesystem-routing/api';
import { postById } from '../../lib/content';
import { SITE } from '../../site.config';

/**
 * Raw markdown mirror of each post at /blog/<slug>.md — the emerging
 * convention AI agents fetch instead of scraping HTML.
 */
export const GET: APIHandler = ({ request }) => {
  // parse the slug off the URL — the matcher's ":slug.md" param naming is
  // ambiguous, the pathname isn't
  const slug = new URL(request.url).pathname.match(/^\/blog\/([^/]+)\.md$/)?.[1] ?? '';
  const post = postById(slug);
  if (!post) return new Response('Not found', { status: 404 });

  const meta = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `- Author: ${SITE.author} (${SITE.url}/)`,
    `- Published: ${post.publishDate.toISOString().split('T')[0]}`,
    ...(post.updatedDate ? [`- Updated: ${post.updatedDate.toISOString().split('T')[0]}`] : []),
    `- Tags: ${post.tags.join(', ')}`,
    `- Canonical: ${SITE.url}/blog/${post.id}/`,
    '',
    '---',
    '',
  ];

  return new Response(meta.join('\n') + post.body + '\n', {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
