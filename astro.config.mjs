import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { imageService } from '@unpic/astro/service';

export default defineConfig({
  site: 'https://palash.dev',
  output: 'static',
  integrations: [mdx(), sitemap()],
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
