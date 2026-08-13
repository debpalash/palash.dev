import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allProducts = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
  const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
  const experiments = await getCollection('experiments');

  const lines: string[] = [
    '# Palash Debnath',
    '',
    '> Palash Debnath is a software engineer and product builder in India. He builds open-source, local-first tools for AI audio, media, and developer memory.',
    '',
    'Canonical website: https://palash.dev/',
    'Author: https://palash.dev/#person',
    'GitHub: https://github.com/debpalash',
    'X: https://x.com/idebpalash',
    'RSS: https://palash.dev/rss.xml',
    '',
    '## Start here',
    '',
    '- [Homepage](https://palash.dev/): profile, shipped work, and current focus',
    '- [Writing](https://palash.dev/blog/): engineering and product notes',
    '- [Experiments](https://palash.dev/lab/): small open-source prototypes',
    '- [Media](https://palash.dev/media/): product screenshots and visual references',
    '- [PALASH.OS](https://palash.dev/os/): interactive desktop edition',
    '',
    '## Projects',
    '',
  ];

  for (const p of allProducts) {
    lines.push(`### ${p.data.name} [${p.data.status}]`);
    lines.push(`- Tagline: ${p.data.tagline}`);
    lines.push(`- Description: ${p.data.description}`);
    if (p.data.audience) lines.push(`- Built for: ${p.data.audience}`);
    if (p.data.positioning) lines.push(`- Product thesis: ${p.data.positioning}`);
    if (p.data.proof.length) {
      lines.push(`- Evidence: ${p.data.proof.map((item) => `${item.value} ${item.label}`).join('; ')}`);
    }
    lines.push(`- Page: https://palash.dev/${p.id}/`);
    if (p.data.website) lines.push(`- Website: ${p.data.website}`);
    if (p.data.github) lines.push(`- Source: ${p.data.github}`);
    if (p.data.url && p.data.url !== p.data.github) lines.push(`- Project URL: ${p.data.url}`);
    lines.push(`- Stack: ${p.data.stack.join(', ')}`);
    lines.push(`- Keywords: ${p.data.keywords.join(', ')}`);
    lines.push('');
  }

  lines.push('## Experiments', '');
  for (const experiment of experiments) {
    lines.push(`- [${experiment.data.name}](${experiment.data.url}): ${experiment.data.description} (${experiment.data.lang})`);
  }
  lines.push('');

  lines.push('## Writing', '');

  for (const post of allPosts) {
    const date = post.data.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.data.title}`);
    lines.push(`*${date}* — ${post.data.description}`);
    lines.push(`Tags: ${post.data.tags.join(', ')}`);
    lines.push(`URL: https://palash.dev/blog/${post.id}/`);
    lines.push('');
  }

  lines.push('## About', '');
  lines.push('Engineer, product builder, and systems thinker building VoiceStudio.sh, Opal, and memXT in the open.');
  lines.push('Stack: TypeScript, Rust, Zig, Python, CUDA, Astro, Tailwind v4, Cloudflare Workers, Tauri');
  lines.push('Contact: mailto:hi@palash.dev');
  lines.push('GitHub: https://github.com/debpalash');
  lines.push('X: https://x.com/idebpalash');
  lines.push('Humans: https://palash.dev/humans.txt');
  lines.push('');
  lines.push('---');
  lines.push('Source: https://palash.dev');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
