import { For, Show } from 'solid-js';
import { Link, Meta, Title } from '@solidjs/meta';
import { SITE } from '../site.config';

export interface PageMetaProps {
  title: string;
  description?: string;
  /** canonical pathname with trailing slash, e.g. "/", "/blog/", "/blog/foo/" */
  path: string;
  ogImage?: string;
  /** Open Graph type — 'website' for most pages, 'article' for blog posts */
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
}

/**
 * Per-page head tags, hoisted into <head> by @solidjs/meta. The values and
 * ordering mirror the Astro Head.astro so the two deployments can't drift
 * on canonical URLs or OG tags.
 */
export default function PageMeta(props: PageMetaProps) {
  const description = () => props.description ?? SITE.description;
  const fullTitle = () =>
    props.title === SITE.title || props.title.length > 48
      ? props.title
      : `${props.title} | palash.dev`;
  const canonicalUrl = () => `${SITE.url}${props.path}`;
  const ogImageUrl = () => new URL(props.ogImage ?? '/og-default.png', SITE.url).href;
  const ogType = () => props.ogType ?? 'website';

  return (
    <>
      <Title>{fullTitle()}</Title>
      <Meta name="description" content={description()} />
      <Meta
        name="robots"
        content={
          props.noIndex
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        }
      />
      <Link rel="canonical" href={canonicalUrl()} />

      <Meta property="og:type" content={ogType()} />
      <Meta property="og:url" content={canonicalUrl()} />
      <Meta property="og:title" content={fullTitle()} />
      <Meta property="og:description" content={description()} />
      <Meta property="og:image" content={ogImageUrl()} />
      <Meta property="og:image:width" content="1200" />
      <Meta property="og:image:height" content="630" />
      <Meta property="og:image:alt" content={props.title} />
      <Meta property="og:site_name" content="palash.dev" />
      <Meta property="og:locale" content="en_US" />
      <Meta property="og:image:type" content="image/png" />
      <Meta property="og:image:secure_url" content={ogImageUrl()} />
      <Show when={ogType() === 'article' && props.publishedTime}>
        <Meta property="article:published_time" content={props.publishedTime!} />
      </Show>
      <Show when={ogType() === 'article' && props.modifiedTime}>
        <Meta property="article:modified_time" content={props.modifiedTime!} />
      </Show>
      <Show when={ogType() === 'article'}>
        <For each={props.tags ?? []}>
          {(tag) => <Meta property="article:tag" content={tag} />}
        </For>
      </Show>

      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={fullTitle()} />
      <Meta name="twitter:description" content={description()} />
      <Meta name="twitter:image" content={ogImageUrl()} />
      <Meta name="twitter:image:alt" content={props.title} />
      <Meta name="twitter:creator" content={`@${SITE.xHandle}`} />
      <Meta name="twitter:site" content={`@${SITE.xHandle}`} />
    </>
  );
}
