import type { APIRoute } from 'astro';
import { getCollection, render } from 'astro:content';

export const GET: APIRoute = async () => {
  const allProducts = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
  const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
  const experiments = await getCollection('experiments');

  const lines: string[] = [
    '# Palash Debnath — palash.dev',
    '',
    '> Software engineer and product builder in India. Building open-source, local-first tools for AI audio, media, and developer memory.',
    '',
    '---',
    '',
    '## Canonical links',
    '',
    '- Website: https://palash.dev/',
    '- GitHub: https://github.com/debpalash',
    '- X: https://x.com/idebpalash',
    '- Contact: mailto:hi@palash.dev',
    '- RSS: https://palash.dev/rss.xml',
    '- Humans.txt: https://palash.dev/humans.txt',
    '',
    '## Projects',
    '',
  ];

  for (const p of allProducts) {
    lines.push(`### ${p.data.name}`);
    lines.push(`- **Status**: ${p.data.status}`);
    lines.push(`- **Tagline**: ${p.data.tagline}`);
    lines.push(`- **Description**: ${p.data.description}`);
    if (p.data.audience) lines.push(`- **Built for**: ${p.data.audience}`);
    if (p.data.positioning) lines.push(`- **Product thesis**: ${p.data.positioning}`);
    if (p.data.proof.length) {
      lines.push(`- **Evidence**: ${p.data.proof.map((item) => `${item.value} ${item.label}`).join('; ')}`);
    }
    lines.push(`- **Page**: https://palash.dev/${p.id}/`);
    if (p.data.website) lines.push(`- **Website**: ${p.data.website}`);
    if (p.data.github) lines.push(`- **Source**: ${p.data.github}`);
    if (p.data.url && p.data.url !== p.data.github) lines.push(`- **URL**: ${p.data.url}`);
    lines.push(`- **Stack**: ${p.data.stack.join(', ')}`);
    lines.push(`- **Keywords**: ${p.data.keywords.join(', ')}`);
    if (p.data.features.length) {
      lines.push('- **Core capabilities**:');
      for (const feature of p.data.features) {
        lines.push(`  - ${feature.title}: ${feature.description}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', '## Experiments', '');
  for (const experiment of experiments) {
    lines.push(`### ${experiment.data.name}`);
    lines.push(`- **Description**: ${experiment.data.description}`);
    lines.push(`- **Language**: ${experiment.data.lang}`);
    lines.push(`- **URL**: ${experiment.data.url}`);
    lines.push('');
  }

  lines.push('---', '', '## Blog Posts', '');

  for (const post of allPosts) {
    const date = post.data.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.data.title}`);
    lines.push(`- **Date**: ${date}`);
    lines.push(`- **Description**: ${post.data.description}`);
    lines.push(`- **Tags**: ${post.data.tags.join(', ')}`);
    lines.push(`- **URL**: https://palash.dev/blog/${post.id}/`);
    lines.push('');

    // Include the raw markdown body for each post
    try {
      await render(post);
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
  lines.push('**Core Stack**: TypeScript, Rust, Zig, Python, CUDA, Astro, Tailwind v4, Cloudflare Workers, Tauri');
  lines.push('');
  lines.push('**Links**:');
  lines.push('- GitHub: https://github.com/debpalash');
  lines.push('- Website: https://palash.dev');
  lines.push('- RSS: https://palash.dev/rss.xml');
  lines.push('- Humans.txt: https://palash.dev/humans.txt');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
