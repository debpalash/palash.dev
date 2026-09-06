import type { APIHandler } from 'filesystem-routing/api';
import { experiments, posts, products } from '../lib/content';
import { SITE } from '../site.config';

export const GET: APIHandler = () => {
  const lines: string[] = [
    '# Palash Debnath — palash.dev',
    '',
    '> Software engineer and product builder in India. Building open-source tools for AI audio, media, boot media, and developer memory.',
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
    '- Resume: https://palash.dev/resume/ (PDF: /resume.pdf, text: /resume.txt, LLM markdown: /resume.llm.txt, JSON: /resume.json)',
    '',
    '## Projects',
    '',
  ];

  for (const p of products) {
    lines.push(`### ${p.name}`);
    lines.push(`- **Status**: ${p.status}`);
    lines.push(`- **Tagline**: ${p.tagline}`);
    lines.push(`- **Description**: ${p.description}`);
    if (p.audience) lines.push(`- **Built for**: ${p.audience}`);
    if (p.positioning) lines.push(`- **Product thesis**: ${p.positioning}`);
    if (p.proof.length) {
      lines.push(`- **Evidence**: ${p.proof.map((item) => `${item.value} ${item.label}`).join('; ')}`);
    }
    lines.push(`- **Page**: https://palash.dev/${p.id}/`);
    if (p.website) lines.push(`- **Website**: ${p.website}`);
    if (p.github) lines.push(`- **Source**: ${p.github}`);
    if (p.url && p.url !== p.github) lines.push(`- **URL**: ${p.url}`);
    lines.push(`- **Stack**: ${p.stack.join(', ')}`);
    lines.push(`- **Keywords**: ${p.keywords.join(', ')}`);
    if (p.features.length) {
      lines.push('- **Core capabilities**:');
      for (const feature of p.features) {
        lines.push(`  - ${feature.title}: ${feature.description}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', '## Experiments', '');
  for (const experiment of experiments) {
    lines.push(`### ${experiment.name}`);
    lines.push(`- **Description**: ${experiment.description}`);
    lines.push(`- **Language**: ${experiment.lang}`);
    lines.push(`- **URL**: ${experiment.url}`);
    lines.push('');
  }

  lines.push('---', '', '## Blog Posts', '');

  for (const post of posts) {
    const date = post.publishDate.toISOString().split('T')[0];
    lines.push(`### ${post.title}`);
    lines.push(`- **Date**: ${date}`);
    lines.push(`- **Description**: ${post.description}`);
    lines.push(`- **Tags**: ${post.tags.join(', ')}`);
    lines.push(`- **URL**: https://palash.dev/blog/${post.id}/`);
    lines.push('');
    if (post.body) {
      lines.push('#### Content', '');
      lines.push(post.body);
      lines.push('');
    }
  }

  lines.push('---', '', '## About', '');
  lines.push('Palash is an engineer, product builder, and systems thinker who makes developer tools,');
  lines.push('media platforms, and infrastructure that bridge low-level performance and high-level UX.');
  lines.push('');
  lines.push(`**Core Stack**: ${SITE.stack.join(', ')}`);
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
