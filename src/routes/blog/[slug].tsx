import { For, Show } from 'solid-js';
import type { RouteDefinition, RouteProps } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import { Link } from '@solidjs/meta';
import PageShell from '../../components/PageShell';
import NotFound from '../../components/NotFound';
import JsonLd from '../../components/JsonLd';
import { postById, posts, products, type Post } from '../../lib/content';
import { SITE } from '../../site.config';

export const route = {
  preload: ({ params }) => {
    if (!postById(params.slug!)) httpStatus(404);
  },
} satisfies RouteDefinition;

function PostPage(props: { post: Post }) {
  const post = props.post;
  const index = posts.indexOf(post);
  const newerPost = index > 0 ? posts[index - 1] : undefined;
  const olderPost = index < posts.length - 1 ? posts[index + 1] : undefined;
  const relatedProduct = products.find((product) => post.tags.includes(product.id));

  const date = post.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const readingMinutes = Math.max(1, Math.ceil(post.wordCount / 220));

  const postUrl = `${SITE.url}/blog/${post.id}/`;
  const personId = `${SITE.url}/#person`;
  const breadcrumbId = `${postUrl}#breadcrumb`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${postUrl}#post`,
        headline: post.title,
        description: post.description,
        url: postUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${postUrl}#webpage`, url: postUrl },
        datePublished: post.publishDate.toISOString(),
        dateModified: (post.updatedDate ?? post.publishDate).toISOString(),
        keywords: post.tags.join(', '),
        articleSection: post.tags[0] ?? 'Engineering',
        wordCount: post.wordCount,
        image: new URL(`/og/blog-${post.id}.png`, SITE.url).href,
        author: { '@id': personId, '@type': 'Person', name: SITE.author, url: SITE.url },
        publisher: { '@id': personId },
        isPartOf: { '@id': `${SITE.url}/blog/#blog` },
        ...(relatedProduct ? { about: { '@id': `${SITE.url}/${relatedProduct.id}/#app` } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: 'The Log', item: `${SITE.url}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
        ],
      },
    ],
  };

  return (
    <PageShell
      title={post.title}
      description={post.description}
      path={`/blog/${post.id}/`}
      ogImage={`/og/blog-${post.id}.png`}
      ogType="article"
      publishedTime={post.publishDate.toISOString()}
      modifiedTime={(post.updatedDate ?? post.publishDate).toISOString()}
      tags={post.tags}
      mainEntityId={`${postUrl}#post`}
      breadcrumbId={breadcrumbId}
      narrow
    >
      <JsonLd data={jsonLd} />
      <Link
        rel="alternate"
        type="text/markdown"
        title="Markdown"
        href={`${SITE.url}/blog/${post.id}.md`}
      />

      <p class="back-link mono">
        <a href="/blog" class="muted">← Field notes</a>
      </p>

      <article>
        <header class="article-head">
          <h1>{post.title}</h1>
          <p class="article-desc">{post.description}</p>
          <div class="article-meta">
            <span>By <a href="/">{SITE.author}</a></span>
            <time datetime={post.publishDate.toISOString()}>{date}</time>
            <span>{readingMinutes} min read</span>
            <For each={post.tags}>{(t) => <span class="tag">{t}</span>}</For>
          </div>
        </header>

        <div class="prose" innerHTML={post.html} />
      </article>

      <Show when={relatedProduct}>
        {(product) => (
          <aside class="article-related">
            <p class="product-eyebrow mono">Related product</p>
            <a href={`/${product().id}`}>
              <span>
                <strong>{product().name}</strong>
                <small>{product().tagline}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </aside>
        )}
      </Show>

      <nav class="post-nav" aria-label="More field notes">
        <Show when={newerPost} fallback={<span></span>}>
          {(newer) => (
            <a href={`/blog/${newer().id}`} rel="prev">
              <small class="mono">Newer</small>
              <strong>{newer().title}</strong>
            </a>
          )}
        </Show>
        <Show when={olderPost}>
          {(older) => (
            <a href={`/blog/${older().id}`} rel="next">
              <small class="mono">Older</small>
              <strong>{older().title}</strong>
            </a>
          )}
        </Show>
      </nav>

      <p class="article-foot mono">
        <a href="/blog">All field notes</a>
        <span class="muted">·</span>
        <a href={`/blog/${post.id}.md`} rel="external">Raw markdown ↗</a>
      </p>
    </PageShell>
  );
}

export default function BlogPostRoute(props: RouteProps<'/blog/:slug'>) {
  return (
    // keyed: recreate the page when the slug resolves to a different post —
    // PostPage snapshots its prop, so it must not be reused across posts.
    <Show
      keyed
      when={postById(props.params.slug!)}
      fallback={<NotFound path={`/blog/${props.params.slug}/`} />}
    >
      {(post) => <PostPage post={post} />}
    </Show>
  );
}
