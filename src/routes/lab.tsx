import { Show } from 'solid-js';
import ProfileShell from '../components/ProfileShell';
import LabFeed from '../components/LabFeed';
import JsonLd from '../components/JsonLd';
import { experiments } from '../lib/content';
import { SITE } from '../site.config';

const labUrl = `${SITE.url}/lab/`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ItemList',
      '@id': `${labUrl}#items`,
      name: 'Open-source experiments by Palash Debnath',
      numberOfItems: experiments.length,
      itemListElement: experiments.map((experiment, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: experiment.name,
        url: experiment.url,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${labUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Experiments', item: labUrl },
      ],
    },
  ],
};

export default function Lab() {
  return (
    <ProfileShell
      title="Experiments — spikes, prototypes and one-offs"
      description="Smaller things by Palash Debnath — spikes, prototypes and one-offs, all open source on GitHub."
      ogImage="/og/lab.png"
      path="/lab/"
      active="lab"
      schemaType="CollectionPage"
      mainEntityId={`${labUrl}#items`}
      breadcrumbId={`${labUrl}#breadcrumb`}
    >
      <JsonLd data={jsonLd} />

      <Show when={experiments.length > 0} fallback={<p class="feed-empty">Nothing here yet.</p>}>
        <LabFeed items={experiments} />
      </Show>
    </ProfileShell>
  );
}
