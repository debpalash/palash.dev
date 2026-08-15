import { postById } from './content';
import { SITE } from '../site.config';

/**
 * Raw markdown mirror of each post at /blog/<slug>.md — the convention AI
 * agents fetch instead of scraping HTML. Served from the middleware chain
 * (not a file route: the router's ":slug.md" pattern matches whole segments
 * and would swallow the post pages themselves).
 */
export function servePostMarkdown(request: Request): Response | undefined {
  const slug = new URL(request.url).pathname.match(/^\/blog\/([^/]+)\.md$/)?.[1];
  if (!slug) return undefined;
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
}
