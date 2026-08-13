import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { imageService } from '@unpic/astro/service';

const siteUrl = 'https://palash.dev';
const blogLastModified = new Map(
  readdirSync('./src/content/blog')
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const source = readFileSync(`./src/content/blog/${file}`, 'utf8');
      const updated = source.match(/^updatedDate:\s*["']?([^"'\n]+)["']?/m)?.[1];
      const published = source.match(/^publishDate:\s*["']?([^"'\n]+)["']?/m)?.[1];
      const date = updated ?? published;
      return [file.replace(/\.(md|mdx)$/, ''), date ? new Date(date) : undefined];
    }),
);
const productLastModified = new Map(
  readdirSync('./src/content/products')
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const source = readFileSync(`./src/content/products/${file}`, 'utf8');
      const updated = source.match(/"updatedDate"\s*:\s*"([^"]+)"/)?.[1];
      return [file.replace(/\.json$/, ''), updated ? new Date(updated) : undefined];
    }),
);
const newestContentDate = [...blogLastModified.values(), ...productLastModified.values()]
  .filter(Boolean)
  .reduce((latest, date) => date > latest ? date : latest, new Date(0));
const pageWeight = (pathname) => {
  if (pathname === '/') return { changefreq: 'weekly', priority: 1 };
  if (/^\/(omnivoice|memxt|opal)\/$/.test(pathname)) return { changefreq: 'monthly', priority: 0.9 };
  if (pathname === '/blog/') return { changefreq: 'weekly', priority: 0.8 };
  if (/^\/blog\/.+\/$/.test(pathname)) return { changefreq: 'monthly', priority: 0.75 };
  if (pathname === '/lab/' || pathname === '/media/') return { changefreq: 'monthly', priority: 0.65 };
  if (pathname === '/os/') return { changefreq: 'yearly', priority: 0.35 };
  return { changefreq: 'yearly', priority: 0.5 };
};

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const blogSlug = pathname.match(/^\/blog\/([^/]+)\/$/)?.[1];
        const productSlug = pathname.match(/^\/(omnivoice|memxt|opal)\/$/)?.[1];
        const lastmod = blogSlug
          ? blogLastModified.get(blogSlug)
          : productSlug
            ? productLastModified.get(productSlug)
            : pathname === '/' || pathname === '/blog/'
              ? newestContentDate
              : undefined;
        return {
          ...item,
          ...pageWeight(pathname),
          ...(lastmod && lastmod.valueOf() > 0 ? { lastmod } : {}),
        };
      },
      namespaces: { news: false, xhtml: false, image: false, video: false },
    }),
  ],
  image: {
    // 'cloudflare' keeps the service pure-URL (sharp's native CJS can't load
    // in the workerd dev runtime) and uses CF Image Transformations in prod
    service: imageService({ fallbackService: 'cloudflare' }),
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      // This machine runs several watcher-heavy tools concurrently. Polling
      // keeps local development working when the shared inotify limit is full.
      watch: {
        usePolling: true,
        interval: 250,
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
