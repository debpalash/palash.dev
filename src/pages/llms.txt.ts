import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allProducts = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
  const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  const lines: string[] = [
    '# Palash',
    '',
    'Engineer and product builder. I make developer tools, media platforms, and infrastructure.',
    '',
    '## Projects',
    '',
  ];

  for (const p of allProducts) {
    lines.push(`### ${p.data.name} [${p.data.status}]`);
    lines.push(`${p.data.tagline}`);
    lines.push(`${p.data.description}`);
    if (p.data.url) lines.push(`URL: ${p.data.url}`);
    lines.push(`Stack: ${p.data.stack.join(', ')}`);
    lines.push('');
  }

  lines.push('## Writing', '');

  for (const post of allPosts) {
    const date = post.data.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.data.title}`);
    lines.push(`*${date}* — ${post.data.description}`);
    lines.push(`Tags: ${post.data.tags.join(', ')}`);
    lines.push(`URL: https://palash.dev/blog/${post.id}`);
    lines.push('');
  }

  lines.push('## About', '');
  lines.push('Engineer, product builder, systems thinker.');
  lines.push('Stack: TypeScript, Rust, Zig, Python, CUDA, Astro, React, Cloudflare Workers');
  lines.push('GitHub: https://github.com/debpalash');
  lines.push('');
  lines.push('---');
  lines.push('Source: https://palash.dev');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noai',
    },
  });
};
