import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  return rss({
    title: 'Palash Debnath — The Log',
    description: 'Engineering, product, AI, and open-source notes from Palash Debnath.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      author: 'Palash Debnath (hi@palash.dev)',
    })),
    customData: [
      '<language>en-us</language>',
      '<copyright>© Palash Debnath</copyright>',
      '<managingEditor>hi@palash.dev (Palash Debnath)</managingEditor>',
      '<webMaster>hi@palash.dev (Palash Debnath)</webMaster>',
      '<ttl>60</ttl>',
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    ].join(''),
  });
}
