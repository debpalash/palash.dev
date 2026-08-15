import type { ParentProps } from 'solid-js';
import PageMeta, { type PageMetaProps } from './PageMeta';
import JsonLd from './JsonLd';
import { webPageLd } from '../lib/seo';

export interface PageShellProps extends PageMetaProps, ParentProps {
  /** schema.org page type; specialized pages use ProfilePage/CollectionPage */
  schemaType?: string | string[];
  /** canonical entity this page is primarily presenting */
  mainEntityId?: string;
  /** breadcrumb node emitted by the route-level graph */
  breadcrumbId?: string;
  /** narrower measure for long-form reading (blog posts, product pages) */
  narrow?: boolean;
  /** wider measure with no top padding — the profile pages supply their own */
  wide?: boolean;
}

/**
 * Reading-mode shell: focused content + footer, no desktop chrome.
 * Pairs with page.css — the Solid port of layouts/Page.astro.
 */
export default function PageShell(props: PageShellProps) {
  return (
    <>
      <PageMeta
        title={props.title}
        description={props.description}
        path={props.path}
        ogImage={props.ogImage}
        ogType={props.ogType}
        publishedTime={props.publishedTime}
        modifiedTime={props.modifiedTime}
        tags={props.tags}
        noIndex={props.noIndex}
      />
      <main id="main" class={['shell', { 'shell-wide': !!props.wide }]}>
        <JsonLd
          data={webPageLd({
            path: props.path,
            title: props.title,
            description: props.description,
            schemaType: props.schemaType,
            mainEntityId: props.mainEntityId,
            breadcrumbId: props.breadcrumbId,
          })}
        />
        {/* narrow pages keep the reading measure inside the shared frame */}
        <div class={{ 'shell-measure': !!props.narrow }}>{props.children}</div>
      </main>
    </>
  );
}
