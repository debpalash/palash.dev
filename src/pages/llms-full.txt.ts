import type { APIRoute } from 'astro';
import { getCollection, render } from 'astro:content';

export const GET: APIRoute = async () => {
  const allProducts = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
  const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  const lines: string[] = [
    '# Palash — palash.dev',
    '',
    '> Engineer and product builder. Building tools at the intersection of AI, audio, and infrastructure.',
    '',
    '---',
    '',
    '## Projects',
    '',
  ];

  for (const p of allProducts) {
    lines.push(`### ${p.data.name}`);
    lines.push(`- **Status**: ${p.data.status}`);
    lines.push(`- **Tagline**: ${p.data.tagline}`);
    lines.push(`- **Description**: ${p.data.description}`);
    if (p.data.url) lines.push(`- **URL**: ${p.data.url}`);
    lines.push(`- **Stack**: ${p.data.stack.join(', ')}`);
    lines.push('');
  }

  lines.push('---', '', '## Blog Posts', '');

  for (const post of allPosts) {
    const date = post.data.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.data.title}`);
    lines.push(`- **Date**: ${date}`);
    lines.push(`- **Description**: ${post.data.description}`);
    lines.push(`- **Tags**: ${post.data.tags.join(', ')}`);
    lines.push(`- **URL**: https://palash.dev/blog/${post.id}`);
    lines.push('');

    // Include the raw markdown body for each post
    try {
      const { remarkPluginFrontmatter } = await render(post);
      if (post.body) {
        lines.push('#### Content', '');
        lines.push(post.body);
        lines.push('');
      }
    } catch {
      // skip if render fails
    }
  }

  lines.push('---', '', '## About', '');
  lines.push('Palash is an engineer, product builder, and systems thinker who makes developer tools,');
  lines.push('media platforms, and infrastructure that bridge low-level performance and high-level UX.');
  lines.push('');
  lines.push('**Core Stack**: TypeScript, Rust, Zig, Python, CUDA, Astro, React, Tailwind v4, Cloudflare Workers, Tauri');
  lines.push('');
  lines.push('**Links**:');
  lines.push('- GitHub: https://github.com/debpalash');
  lines.push('- Website: https://palash.dev');
  lines.push('- RSS: https://palash.dev/rss.xml');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
