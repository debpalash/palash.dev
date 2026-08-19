import { Show } from 'solid-js';
import { Script } from '@solidjs/meta';
import ProfileShell from '../components/ProfileShell';
import WorkFeed from '../components/WorkFeed';
import JsonLd from '../components/JsonLd';
import { gallery, products } from '../lib/content';
import { SITE } from '../site.config';

// ------------------------------------------------------------------
// structured data — the canonical entity graph for the site lives here,
// on the canonical homepage. /os intentionally does not repeat it.
// ------------------------------------------------------------------
const personId = `${SITE.url}/#person`;
const orgId = `${SITE.url}/#yupcha`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      name: SITE.author,
      alternateName: [SITE.alternateName, SITE.xHandle, 'Palash', 'palash.dev'],
      url: SITE.url,
      mainEntityOfPage: { '@id': `${SITE.url}/#webpage` },
      image: new URL(SITE.avatar, SITE.url).href,
      jobTitle: 'Software Engineer & Product Builder',
      description: SITE.description,
      sameAs: [SITE.github, SITE.x, SITE.voicestudio, SITE.company.url],
      knowsAbout: SITE.stack,
      homeLocation: {
        '@type': 'Place',
        name: 'Agartala, Tripura, India',
        address: { '@type': 'PostalAddress', addressLocality: 'Agartala', addressRegion: 'Tripura', addressCountry: 'IN' },
      },
      worksFor: { '@id': orgId },
    },
    {
      '@type': 'Organization',
      '@id': orgId,
      name: SITE.company.name,
      url: SITE.company.url,
      description: SITE.company.tagline,
      founder: { '@id': personId },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: 'palash.dev',
      alternateName: [SITE.author, SITE.alternateName, SITE.xHandle],
      inLanguage: 'en',
      publisher: { '@id': personId },
      hasPart: [
        { '@id': `${SITE.url}/blog/#blog` },
        ...products.map((product) => ({ '@id': `${SITE.url}/${product.id}/#app` })),
      ],
    },
    ...products.map((p) => {
      const repository = p.github ?? p.url;
      const readme = p.github ? `${p.github.replace(/\/$/, '')}#readme` : undefined;
      return {
        '@type': 'SoftwareApplication',
        '@id': `${SITE.url}/${p.id}/#app`,
        name: p.name,
        ...(p.alternateNames.length ? { alternateName: p.alternateNames } : {}),
        description: p.description,
        applicationCategory: p.category,
        operatingSystem: p.os,
        url: `${SITE.url}/${p.id}/`,
        // Same entity, other homes: the product's own domain and repo. The
        // product-page graph already does this; the homepage graph is the
        // canonical one, so the links matter most here.
        ...(p.website || p.github
          ? { sameAs: [p.website, p.github].filter(Boolean) }
          : {}),
        ...(repository ? { codeRepository: repository } : {}),
        ...(readme ? { subjectOf: { '@type': 'CreativeWork', name: `${p.name} README`, url: readme } } : {}),
        ...(p.logoUrl ? { image: new URL(p.logoUrl, SITE.url).href } : {}),
        author: { '@id': personId },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        ...(p.features.length ? { featureList: p.features.map((feature) => feature.title) } : {}),
        ...(p.audience
          ? { audience: { '@type': 'Audience', audienceType: p.audience } }
          : {}),
        ...(p.keywords.length ? { keywords: p.keywords.join(', ') } : {}),
        ...(p.updatedDate ? { dateModified: p.updatedDate.toISOString() } : {}),
      };
    }),
  ],
};

/**
 * Links out in the wild still point at the retired desktop's windows by hash
 * (/#doc-hello-world, /#prg-memxt …). Hashes never reach the server, so map
 * them to their reading-mode homes client-side instead of dropping visitors.
 */
const hashForward = [
  '(function(){try{',
  'var id=location.hash.slice(1);',
  'if(!id)return;',
  'var m=id.match(/^prg-(omnivoice|bootable|memxt|opal)$/);',
  "if(m){location.replace('/'+m[1]);return;}",
  'm=id.match(/^doc-(.+)$/);',
  "if(m){location.replace('/blog/'+m[1]);return;}",
  "if(/^(gal-.+|gallery)$/.test(id)){location.replace('/media');return;}",
  "if(id==='experiments'){location.replace('/lab');return;}",
  "if(/^(contact|company)$/.test(id)){location.replace('/contact');return;}",
  "if(id==='docs')location.replace('/blog');",
  '}catch(e){}})();',
].join('');

export default function Home() {
  return (
    <ProfileShell
      title={SITE.title}
      description={SITE.description}
      path="/"
      active="work"
      schemaType="ProfilePage"
      mainEntityId={personId}
    >
      <JsonLd data={jsonLd} />
      {/* hoisted to head like JsonLd: raw scripts must stay out of the hydration claim walk */}
      <Script>{hashForward}</Script>

      <Show when={products.length > 0} fallback={<p class="feed-empty">Nothing here yet.</p>}>
        <WorkFeed products={products} gallery={gallery} />
      </Show>
    </ProfileShell>
  );
}
