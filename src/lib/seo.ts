import { SITE } from '../site.config';

/** Title logic shared by PageMeta and the per-page WebPage JSON-LD node. */
export const fullTitle = (title: string) =>
  title === SITE.title || title.length > 48 ? title : `${title} | palash.dev`;

/** The WebPage node every page carries — mirrors Head.astro's route-level graph. */
export function webPageLd(opts: {
  /** canonical pathname with trailing slash */
  path: string;
  title: string;
  description?: string;
  schemaType?: string | string[];
  mainEntityId?: string;
  breadcrumbId?: string;
}) {
  const canonicalUrl = `${SITE.url}${opts.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': opts.schemaType ?? 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: fullTitle(opts.title),
    description: opts.description ?? SITE.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE.url}/#website` },
    about: { '@id': `${SITE.url}/#person` },
    ...(opts.mainEntityId ? { mainEntity: { '@id': opts.mainEntityId } } : {}),
    ...(opts.breadcrumbId ? { breadcrumb: { '@id': opts.breadcrumbId } } : {}),
  };
}
