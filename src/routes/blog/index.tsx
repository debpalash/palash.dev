import { Show } from 'solid-js';
import ProfileShell from '../../components/ProfileShell';
import WritingFeed from '../../components/WritingFeed';
import JsonLd from '../../components/JsonLd';
import { posts } from '../../lib/content';
import { SITE } from '../../site.config';

const blogUrl = `${SITE.url}/blog/`;
const personId = `${SITE.url}/#person`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Blog',
      '@id': `${blogUrl}#blog`,
      name: 'The Log',
      description:
        'Notes on engineering, shipping, and building in public — by Palash Debnath.',
      url: blogUrl,
      inLanguage: 'en',
      author: { '@id': personId, '@type': 'Person', name: SITE.author, url: SITE.url },
      publisher: { '@id': personId },
      blogPost: posts.map((post) => ({
        '@type': 'BlogPosting',
        '@id': `${SITE.url}/blog/${post.id}/#post`,
        headline: post.title,
        description: post.description,
        url: `${SITE.url}/blog/${post.id}/`,
        datePublished: post.publishDate.toISOString(),
        dateModified: (post.updatedDate ?? post.publishDate).toISOString(),
        keywords: post.tags.join(', '),
        author: { '@id': personId },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${blogUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: 'The Log', item: blogUrl },
      ],
    },
  ],
};

export default function BlogIndex() {
  return (
    <ProfileShell
      title="The Log — writing on engineering & shipping"
      description="Notes on engineering, shipping, and building in public — by Palash Debnath. Updated often."
      ogImage="/og/blog.png"
      path="/blog/"
      active="writing"
      schemaType="CollectionPage"
      mainEntityId={`${blogUrl}#blog`}
      breadcrumbId={`${blogUrl}#breadcrumb`}
    >
      <JsonLd data={jsonLd} />

      <Show when={posts.length > 0} fallback={<p class="feed-empty">Nothing here yet.</p>}>
        <WritingFeed posts={posts} />
      </Show>
    </ProfileShell>
  );
}
