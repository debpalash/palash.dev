import { SITE } from '../site.config';
import { posts, products, type Post, type Product } from './content';

export interface PageData {
  path: string;
  title: string;
  description: string;
  image: string;
  preloadImage?: string;
  preloadImageSrcset?: string;
  preloadImageSizes?: string;
  kind: 'ProfilePage' | 'CollectionPage' | 'WebPage' | 'ContactPage';
  noIndex?: boolean;
  post?: Post;
  product?: Product;
}
const page = (path: string, title: string, description: string, image: string, kind: PageData['kind'] = 'WebPage'): PageData => ({ path, title, description, image, kind });
const metaDescription = (value: string) => {
  if (value.length <= 160) return value;
  const firstSentence = value.match(/^.*?[.!?](?:\s|$)/)?.[0].trim();
  if (firstSentence && firstSentence.length <= 160) return firstSentence;
  return `${value.slice(0, 156).replace(/\s+\S*$/, '')}…`;
};
const featured = products.find(product => product.featured) ?? products[0];
const featuredImage = featured.homeImage ?? featured.workImage;
const featuredImageSrcset = featured.homeImageSmall && featuredImage
  ? `${featured.homeImageSmall} 675w, ${featuredImage} 1350w`
  : undefined;
export const pages: PageData[] = [
  { ...page('/', 'Palash Debnath — Software engineer', SITE.description, '/social/home.png', 'ProfilePage'),
    preloadImage: featuredImage, preloadImageSrcset: featuredImageSrcset,
    preloadImageSizes: featuredImageSrcset ? '(min-width: 860px) 45vw, calc(100vw - 32px)' : undefined },
  page('/blog/', 'Writing — Palash Debnath', 'Notes on software, AI, and building open-source tools.', '/social/blog.png', 'CollectionPage'),
  page('/lab/', 'Lab — Palash Debnath', 'Every other public repo by Palash Debnath: experiments, developer tools, plugins, and courses.', '/social/lab.png', 'CollectionPage'),
  page('/media/', 'Screenshots — Palash Debnath', 'Desktop and terminal interfaces from VoiceStudio, Bootable, Opal, and memXT.', '/social/media.png', 'CollectionPage'),
  page('/contact/', 'Contact — Palash Debnath', 'Email, GitHub, and social links for Palash Debnath.', '/social/contact.png', 'ContactPage'),
  page('/resume/', 'Résumé — Palash Debnath', 'Software engineering experience, skills, and open-source projects. PDF, text, and JSON downloads.', '/social/resume.png', 'ProfilePage'),
  { ...page('/search/', 'Search — palash.dev', 'Search Palash Debnath’s open-source projects, products, experiments, and engineering articles.', '/social/search.png'), noIndex: true },
  { ...page('/preview/', 'Publishing preview — palash.dev', 'Inspect every page’s search metadata, social preview card, and structured data before publishing.', '/social/preview.png'), noIndex: true },
  ...products.map(p => ({ ...page(`/${p.id}/`, `${p.name} — ${p.tagline}`, metaDescription(p.description), `/social/${p.id}.png`), product: p })),
  ...posts.map(p => ({ ...page(`/blog/${p.id}/`, p.title, p.description, `/social/blog-${p.id}.png`), post: p })),
];
export const pageByPath = (path: string) => {
  const result = pages.find(p => p.path === path);
  if (!result) throw new Error(`Missing page metadata: ${path}`);
  return result;
};
export const canonical = (path: string) => new URL(path, SITE.url).href;
export function schemaFor(page: PageData) {
  const url = canonical(page.path);
  const personId = `${SITE.url}/#person`;
  const organizationId = `${SITE.company.url}/#organization`;
  const websiteId = `${SITE.url}/#website`;
  const webpageId = `${url}#webpage`;
  const image = {
    '@type': 'ImageObject',
    '@id': `${url}#primaryimage`,
    url: canonical(page.image),
    contentUrl: canonical(page.image),
    caption: page.title,
    representativeOfPage: true,
    width: 1200,
    height: 630,
  };
  const person = {
    '@type': 'Person',
    '@id': personId,
    name: SITE.author,
    alternateName: [SITE.handle, SITE.xHandle],
    description: SITE.description,
    url: `${SITE.url}/`,
    image: canonical(SITE.avatar),
    jobTitle: 'Agentic Software Designer and Software Engineer',
    sameAs: [SITE.github, SITE.x],
    knowsAbout: [...SITE.stack, 'AI agents', 'Local-first software', 'Open-source software'],
    homeLocation: { '@type': 'Place', name: 'Agartala, Tripura, India' },
    worksFor: { '@id': organizationId },
    mainEntityOfPage: { '@id': `${SITE.url}/#webpage` },
    subjectOf: { '@id': `${SITE.url}/resume/#webpage` },
  };
  const entityId = page.post ? `${url}#article` : page.product ? `${url}#app` : page.kind === 'ProfilePage' ? personId : undefined;
  const graph: Record<string, unknown>[] = [
    person,
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE.company.name,
      url: SITE.company.url,
      description: SITE.company.blurb,
      sameAs: ['https://github.com/Yupcha'],
      founder: { '@id': personId },
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${SITE.url}/`,
      name: SITE.name,
      description: SITE.description,
      publisher: { '@id': personId },
      about: { '@id': personId },
      inLanguage: 'en',
    },
    image,
    {
      '@type': page.kind,
      '@id': webpageId,
      url,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': websiteId },
      primaryImageOfPage: { '@id': image['@id'] },
      inLanguage: 'en',
      ...(entityId ? { mainEntity: { '@id': entityId } } : {}),
      ...(page.path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      ...(page.post ? {
        datePublished: page.post.publishDate.toISOString(),
        dateModified: (page.post.updatedDate ?? page.post.publishDate).toISOString(),
      } : page.product?.updatedDate ? { dateModified: page.product.updatedDate.toISOString() } : {}),
    },
  ];
  if (page.path !== '/') {
    const crumbs = [{ name: 'Home', item: `${SITE.url}/` },
      ...(page.post ? [{ name: 'Writing', item: canonical('/blog/') }] : []),
      { name: page.post?.title ?? page.product?.name ?? page.title.split(' — ')[0], item: url }];
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) });
  }
  if (page.post) {
    const p = page.post;
    graph.push({ '@type': 'BlogPosting', '@id': entityId, headline: p.title, description: p.description,
      image: { '@id': image['@id'] }, datePublished: p.publishDate.toISOString(), dateModified: (p.updatedDate ?? p.publishDate).toISOString(),
      author: { '@id': personId }, publisher: { '@id': personId },
      mainEntityOfPage: { '@id': webpageId }, isPartOf: { '@id': websiteId }, url, inLanguage: 'en', wordCount: p.wordCount,
      articleSection: p.tags[0] ?? 'Engineering', about: p.tags.map(name => ({ '@type': 'Thing', name })),
      keywords: p.tags, isAccessibleForFree: true });
  }
  if (page.product) {
    const p = page.product;
    const sourceId = p.github && p.openSource ? `${url}#source` : undefined;
    graph.push({ '@type': 'SoftwareApplication', '@id': entityId, name: p.name, alternateName: p.alternateNames,
      description: p.description, url, applicationCategory: p.category, operatingSystem: p.os,
      image: { '@id': image['@id'] }, author: { '@id': personId }, creator: { '@id': personId },
      sameAs: [p.website, p.github].filter(Boolean), ...(p.github ? { downloadUrl: `${p.github}/releases` } : {}),
      ...(sourceId ? { subjectOf: { '@id': sourceId } } : {}),
      featureList: p.features.map(f => `${f.title}: ${f.description}`), keywords: p.keywords,
      ...(p.license ? { license: `https://spdx.org/licenses/${p.license}.html` } : {}),
      ...(p.updatedDate ? { dateModified: p.updatedDate.toISOString() } : {}),
      ...(p.pricing === 'free' ? { isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: p.status === 'coming-soon' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock' } } : {}),
    });
    if (sourceId) {
      graph.push({
        '@type': 'SoftwareSourceCode',
        '@id': sourceId,
        name: `${p.name} source code`,
        codeRepository: p.github,
        runtimePlatform: p.os,
        keywords: p.stack,
        author: { '@id': personId },
        targetProduct: { '@id': entityId },
        ...(p.license ? { license: `https://spdx.org/licenses/${p.license}.html` } : {}),
      });
    }
  }
  if (page.kind === 'CollectionPage' || page.path === '/') {
    const entries = page.path === '/blog/' ? posts.map(p => ({ name: p.title, url: canonical(`/blog/${p.id}/`) }))
      : page.path === '/' ? products.map(p => ({ name: p.name, url: canonical(`/${p.id}/`) })) : [];
    if (entries.length) graph.push({ '@type': 'ItemList', '@id': `${url}#items`, itemListElement: entries.map((p, i) => ({ '@type': 'ListItem', position: i + 1, ...p })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
