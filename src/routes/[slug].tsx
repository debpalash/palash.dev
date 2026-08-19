import { For, Show } from 'solid-js';
import type { RouteDefinition, RouteProps } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import PageShell from '../components/PageShell';
import NotFound from '../components/NotFound';
import JsonLd from '../components/JsonLd';
import GalleryStrip from '../components/GalleryStrip';
import { gallery, posts, productById, type Product } from '../lib/content';
import { SITE } from '../site.config';

export const route = {
  preload: ({ params }) => {
    if (!productById(params.slug!)) httpStatus(404);
  },
} satisfies RouteDefinition;

const formatStars = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count);

function ProductPage(props: { product: Product }) {
  const p = props.product;
  const screenshots = gallery.filter((g) => g.group === p.id);
  const relatedPosts = posts.filter((post) => post.tags.includes(p.id));

  const statusLabel =
    ({ live: 'live', beta: 'beta', 'coming-soon': 'coming soon' } as Record<string, string>)[p.status] ?? p.status;

  const pageUrl = `${SITE.url}/${p.id}/`;
  const personId = `${SITE.url}/#person`;
  const readmeUrl = p.github ? `${p.github.replace(/\/$/, '')}#readme` : undefined;
  const downloadUrl = p.github ? `${p.github.replace(/\/$/, '')}/releases` : p.url;
  const repoUrl = p.github ?? p.url;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const licenseUrl = p.license
    ? ({
        'AGPL-3.0': 'https://spdx.org/licenses/AGPL-3.0-only.html',
        'Apache-2.0': 'https://spdx.org/licenses/Apache-2.0.html',
        'GPL-3.0': 'https://spdx.org/licenses/GPL-3.0-only.html',
        MIT: 'https://spdx.org/licenses/MIT.html',
      } as Record<string, string>)[p.license] ?? p.license
    : undefined;
  const seoTitle =
    ({
      omnivoice: 'VoiceStudio.sh — Open-source AI voice studio',
      bootable: 'Bootable — Cross-platform boot media writer',
      memxt: 'memXT — Local-first memory for AI agents',
      opal: 'Opal — AI media player for everything',
    } as Record<string, string>)[p.id] ?? `${p.name} — ${p.tagline}`;
  const seoDescription =
    ({
      omnivoice:
        'VoiceStudio.sh is an open-source ElevenLabs alternative for AI dubbing, voice cloning, and multilingual voice generation.',
      bootable:
        'Open-source bootable USB and SD writer for ISO, IMG, RAW, and compressed images on Linux, Windows, and macOS.',
      memxt:
        'memXT is local-first, open-source long-term memory for AI coding agents. Persistent context in one static binary, entirely on-device.',
      opal:
        'Opal is an AI media player for files, sites, servers, and feeds, built in Zig for macOS, Linux, and Windows.',
    } as Record<string, string>)[p.id] ?? p.description;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${pageUrl}#app`,
        name: p.name,
        ...(p.alternateNames.length ? { alternateName: p.alternateNames } : {}),
        description: p.description,
        applicationCategory: p.category,
        operatingSystem: p.os,
        url: pageUrl,
        mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        ...(p.logoUrl ? { image: new URL(p.logoUrl, SITE.url).href } : {}),
        ...(repoUrl ? { codeRepository: repoUrl } : {}),
        ...(downloadUrl ? { downloadUrl } : {}),
        ...(readmeUrl ? { subjectOf: { '@type': 'CreativeWork', name: `${p.name} README`, url: readmeUrl } } : {}),
        sameAs: [p.website, p.github].filter(Boolean),
        ...(p.features.length ? { featureList: p.features.map((feature) => feature.title) } : {}),
        ...(p.audience
          ? { audience: { '@type': 'Audience', audienceType: p.audience } }
          : {}),
        ...(screenshots.length
          ? {
              screenshot: screenshots.slice(0, 6).map((shot) => ({
                '@type': 'ImageObject',
                name: shot.title,
                caption: shot.caption,
                contentUrl: shot.src,
              })),
            }
          : {}),
        author: { '@id': personId, '@type': 'Person', name: SITE.author, url: SITE.url },
        publisher: { '@type': 'Organization', name: SITE.company.name, url: SITE.company.url },
        offers: {
          '@type': 'Offer',
          price: p.pricing === 'paid' ? undefined : '0',
          priceCurrency: 'USD',
          availability:
            p.status === 'live' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        },
        ...(p.keywords.length ? { keywords: p.keywords.join(', ') } : {}),
        isAccessibleForFree: p.pricing === 'free',
        ...(licenseUrl ? { license: licenseUrl } : {}),
        ...(p.updatedDate ? { dateModified: p.updatedDate.toISOString() } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: p.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <PageShell
      title={seoTitle}
      description={seoDescription}
      path={`/${p.id}/`}
      ogImage={`/og/${p.id}.png`}
      mainEntityId={`${pageUrl}#app`}
      breadcrumbId={breadcrumbId}
      narrow
    >
      <JsonLd data={jsonLd} />

      <p class="back-link mono">
        <a href="/" class="muted">← Selected work</a>
      </p>

      <article>
        <header class="product-head">
          <Show when={p.logoUrl}>
            <img
              class="product-logo"
              src={p.logoUrl}
              alt={`${p.name} logo`}
              width={56}
              height={56}
              loading="eager"
              decoding="async"
            />
          </Show>
          <div>
            <h1>{p.name}</h1>
            <p class="article-desc">{p.tagline}</p>
            <div class="article-meta">
              <span class={`status status-${p.status}`}>{statusLabel}</span>
              <Show when={p.openSource}><span class="tag">open source</span></Show>
              <Show when={p.pricing}><span class="tag">{p.pricing}</span></Show>
              <Show when={p.license}><span class="tag">{p.license}</span></Show>
              <Show when={p.stars !== undefined}><span class="tag">★ {formatStars(p.stars!)}</span></Show>
              <Show when={p.downloads !== undefined}><span class="tag">⇩ {formatStars(p.downloads!)}</span></Show>
              <For each={p.stack.slice(0, 4)}>{(s) => <span class="tag">{s}</span>}</For>
            </div>
            <nav class="product-links" aria-label={`${p.name} links`}>
              <Show when={p.website}>
                <a href={p.website} target="_blank" rel="noopener">website ↗</a>
              </Show>
              <Show when={repoUrl}>
                <a href={repoUrl} target="_blank" rel="noopener">source ↗</a>
              </Show>
              <Show when={downloadUrl}>
                <a href={downloadUrl} target="_blank" rel="noopener">downloads ↗</a>
              </Show>
            </nav>
          </div>
        </header>

        <Show when={p.proof.length > 0}>
          <dl class="product-proof" aria-label={`${p.name} at a glance`}>
            <For each={p.proof}>
              {(item) => (
                <div>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              )}
            </For>
          </dl>
        </Show>

        <section class="product-section product-thesis">
          <h2>Overview</h2>
          <p>{p.description}</p>
        </section>

        <Show when={p.features.length > 0}>
          <section class="product-section">
            <h2>Capabilities</h2>
            <div class="feature-grid">
              <For each={p.features}>
                {(feature, index) => (
                  <article class="feature-card">
                    <span class="feature-index mono" aria-hidden="true">0{index() + 1}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                )}
              </For>
            </div>
          </section>
        </Show>

        <For each={p.tables}>
          {(t) => (
            <section class="product-section">
              <p class="product-eyebrow mono">{t.eyebrow}</p>
              <h2>{t.heading}</h2>
              <Show when={t.lead}><p class="spec-lead">{t.lead}</p></Show>
              <div class="spec-wrap">
                <table class="spec-table">
                  <thead>
                    <tr>
                      <For each={t.columns}>{(c) => <th scope="col">{c}</th>}</For>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={t.rows}>
                      {(row) => (
                        <tr>
                          <th scope="row">{row[0]}</th>
                          <For each={row.slice(1)}>{(cell) => <td>{cell}</td>}</For>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <Show when={t.footnote}><p class="spec-footnote mono">{t.footnote}</p></Show>
            </section>
          )}
        </For>

        <Show when={screenshots.length > 0}>
          <section class="product-section product-gallery">
            <div class="section-head">
              <div>
                <h2>Screenshots</h2>
              </div>
              <span class="section-more mono muted">{screenshots.length} views</span>
            </div>
            <GalleryStrip items={screenshots} />
          </section>
        </Show>

        <Show when={relatedPosts.length > 0}>
          <section class="product-section related-notes">
            <h2>Related writing</h2>
            <div class="related-list">
              <For each={relatedPosts}>
                {(post) => (
                  <a href={`/blog/${post.id}`}>
                    <span>
                      <strong>{post.title}</strong>
                      <small>{post.description}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </For>
            </div>
          </section>
        </Show>
      </article>
    </PageShell>
  );
}

export default function ProductRoute(props: RouteProps<'/:slug'>) {
  return (
    // keyed: recreate the page when the slug resolves to a different product —
    // ProductPage snapshots its prop, so it must not be reused across products.
    <Show
      keyed
      when={productById(props.params.slug!)}
      fallback={<NotFound path={`/${props.params.slug}/`} />}
    >
      {(product) => <ProductPage product={product} />}
    </Show>
  );
}
