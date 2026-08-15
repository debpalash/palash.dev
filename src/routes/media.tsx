import { Show } from 'solid-js';
import ProfileShell from '../components/ProfileShell';
import MediaGrid from '../components/MediaGrid';
import JsonLd from '../components/JsonLd';
import { gallery, products } from '../lib/content';
import { SITE } from '../site.config';

/** group the shots by product, in work-tab order */
const shots = products.flatMap((p) => gallery.filter((g) => g.group === p.id));

const mediaUrl = `${SITE.url}/media/`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ItemList',
      '@id': `${mediaUrl}#items`,
      name: 'Product interface gallery by Palash Debnath',
      numberOfItems: shots.length,
      itemListElement: shots.map((shot, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'ImageObject',
          name: shot.title,
          caption: shot.caption,
          contentUrl: shot.src,
        },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${mediaUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Media', item: mediaUrl },
      ],
    },
  ],
};

export default function Media() {
  return (
    <ProfileShell
      title="Media — screenshots from the work"
      description="Screenshots from Opal, VoiceStudio.sh and memxt — the tools Palash Debnath builds."
      ogImage="/og/media.png"
      path="/media/"
      active="media"
      schemaType="CollectionPage"
      mainEntityId={`${mediaUrl}#items`}
      breadcrumbId={`${mediaUrl}#breadcrumb`}
    >
      <JsonLd data={jsonLd} />

      <Show when={shots.length > 0} fallback={<p class="feed-empty">Nothing here yet.</p>}>
        <MediaGrid items={shots} />
      </Show>
    </ProfileShell>
  );
}
