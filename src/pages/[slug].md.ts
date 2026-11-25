import type { APIRoute, GetStaticPaths } from 'astro';
import { latestRelease, products, type Product } from '../lib/content';
import { SITE } from '../site.config';
const markdownCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export const getStaticPaths: GetStaticPaths = () =>
  products.map((product) => ({ params: { slug: product.id }, props: { product } }));

export const GET: APIRoute = ({ props }) => {
  const product = props.product as Product;
  const release = latestRelease(product.id);
  const lines = [
    `# ${product.name}`,
    '',
    `> ${product.tagline}`,
    '',
    product.description,
    '',
  ];

  if (product.audience) lines.push('## Built for', '', product.audience, '');
  if (product.positioning) lines.push('## Product thesis', '', product.positioning, '');
  if (product.features.length) {
    lines.push('## Capabilities', '');
    for (const feature of product.features) lines.push(`- **${feature.title}:** ${feature.description}`);
    lines.push('');
  }
  if (product.proof.length) {
    lines.push('## Evidence', '');
    for (const item of product.proof) lines.push(`- ${item.value} ${item.label}`);
    lines.push('');
  }
  for (const table of product.tables) {
    lines.push(`## ${table.heading}`, '');
    if (table.lead) lines.push(table.lead, '');
    lines.push(`| ${table.columns.map(markdownCell).join(' | ')} |`);
    lines.push(`| ${table.columns.map(() => '---').join(' | ')} |`);
    for (const row of table.rows) lines.push(`| ${row.map(markdownCell).join(' | ')} |`);
    if (table.footnote) lines.push('', table.footnote);
    lines.push('');
  }

  lines.push(
    '## Details',
    '',
    `- Status: ${product.status}`,
    `- Category: ${product.category}`,
    `- Operating systems: ${product.os}`,
    `- Stack: ${product.stack.join(', ')}`,
    `- Keywords: ${product.keywords.join(', ')}`,
    `- Open source: ${product.openSource ? 'yes' : 'no'}`,
  );
  if (product.updatedDate) lines.push(`- Updated: ${product.updatedDate.toISOString().split('T')[0]}`);
  if (product.pricing) lines.push(`- Pricing: ${product.pricing}`);
  if (product.stars) lines.push(`- GitHub stars: ${product.stars.toLocaleString('en-US')}`);
  if (product.downloads) lines.push(`- Release downloads: ${product.downloads.toLocaleString('en-US')}`);
  if (release) lines.push(`- Latest release: [${release.tag}](${release.url}) — ${release.publishedAt.slice(0, 10)}`);
  if (product.license) lines.push(`- License: ${product.license}`);
  if (product.website) lines.push(`- Website: ${product.website}`);
  if (product.github) lines.push(`- Source: ${product.github}`);
  lines.push('', `Canonical page: ${SITE.url}/${product.id}/`, '');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
