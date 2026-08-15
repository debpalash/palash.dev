import { For } from 'solid-js';
import ProfileShell from '../components/ProfileShell';
import FeedItem from '../components/FeedItem';
import JsonLd from '../components/JsonLd';
import { SITE } from '../site.config';

const contactUrl = `${SITE.url}/contact/`;
const personId = `${SITE.url}/#person`;

const channels = [
  {
    href: `mailto:${SITE.email}`,
    title: 'Email',
    meta: SITE.email,
    icon: '✉',
    external: false,
  },
  {
    href: SITE.github,
    title: 'GitHub',
    meta: `@${SITE.handle}`,
    icon: '◈',
    external: true,
  },
  {
    href: SITE.x,
    title: 'X',
    meta: `@${SITE.xHandle}`,
    icon: 'X',
    external: true,
  },
  {
    href: SITE.links.find(({ label }) => label === 'ko-fi')?.href ?? 'https://ko-fi.com/debpalash',
    title: 'Ko-fi',
    meta: 'ko-fi.com/debpalash',
    icon: '☕',
    external: true,
  },
  {
    href: SITE.links.find(({ label }) => label === 'paypal')?.href ?? 'https://paypal.me/palashCoder',
    title: 'PayPal',
    meta: 'paypal.me/palashCoder',
    icon: '$',
    external: true,
  },
  {
    href: SITE.company.url,
    title: SITE.company.name,
    meta: 'yupcha.com',
    icon: '▣',
    external: true,
  },
  {
    // external: real resource, not a router page — opens the feed itself
    href: '/rss.xml',
    title: 'RSS',
    meta: '/rss.xml',
    icon: '∿',
    external: true,
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      name: SITE.author,
      email: `mailto:${SITE.email}`,
      url: SITE.url,
      sameAs: [SITE.github, SITE.x],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${contactUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: contactUrl },
      ],
    },
  ],
};

export default function Contact() {
  return (
    <ProfileShell
      title="Contact — email, socials, and support"
      description="Reach Palash Debnath: email, GitHub, X, and ways to support the open-source work via Ko-fi or PayPal."
      path="/contact/"
      active="contact"
      schemaType="ContactPage"
      mainEntityId={personId}
      breadcrumbId={`${contactUrl}#breadcrumb`}
    >
      <JsonLd data={jsonLd} />

      <div class="feed-list">
        <For each={channels}>
          {(c) => (
            <FeedItem href={c.href} title={c.title} meta={c.meta} icon={c.icon} external={c.external} />
          )}
        </For>
      </div>
    </ProfileShell>
  );
}
