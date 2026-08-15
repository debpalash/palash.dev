import type { APIHandler } from 'filesystem-routing/api';
import { experiments, posts, products } from '../lib/content';
import { SITE } from '../site.config';

export const GET: APIHandler = () => {
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
    '- [Contact](https://palash.dev/contact/): every channel and support option',
    '',
    '## Projects',
    '',
  ];

  for (const p of products) {
    lines.push(`### ${p.name} [${p.status}]`);
    lines.push(`- Tagline: ${p.tagline}`);
    lines.push(`- Description: ${p.description}`);
    if (p.audience) lines.push(`- Built for: ${p.audience}`);
    if (p.positioning) lines.push(`- Product thesis: ${p.positioning}`);
    if (p.proof.length) {
      lines.push(`- Evidence: ${p.proof.map((item) => `${item.value} ${item.label}`).join('; ')}`);
    }
    lines.push(`- Page: https://palash.dev/${p.id}/`);
    if (p.website) lines.push(`- Website: ${p.website}`);
    if (p.github) lines.push(`- Source: ${p.github}`);
    if (p.url && p.url !== p.github) lines.push(`- Project URL: ${p.url}`);
    lines.push(`- Stack: ${p.stack.join(', ')}`);
    lines.push(`- Keywords: ${p.keywords.join(', ')}`);
    lines.push('');
  }

  lines.push('## Experiments', '');
  for (const experiment of experiments) {
    lines.push(`- [${experiment.name}](${experiment.url}): ${experiment.description} (${experiment.lang})`);
  }
  lines.push('');

  lines.push('## Writing', '');

  for (const post of posts) {
    const date = post.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.title}`);
    lines.push(`*${date}* — ${post.description}`);
    lines.push(`Tags: ${post.tags.join(', ')}`);
    lines.push(`URL: https://palash.dev/blog/${post.id}/`);
    lines.push('');
  }

  lines.push('## About', '');
  lines.push('Engineer, product builder, and systems thinker building VoiceStudio.sh, Opal, and memXT in the open.');
  lines.push('Also known as: debpalash (GitHub), idebpalash (X). Domain: palash.dev.');
  lines.push(`Stack: ${SITE.stack.join(', ')}`);
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
