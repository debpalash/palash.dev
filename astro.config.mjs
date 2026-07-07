import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { imageService } from '@unpic/astro/service';

export default defineConfig({
  site: 'https://palash.dev',
  output: 'static',
  adapter: cloudflare(),
  integrations: [mdx(), sitemap()],
  image: {
    // 'cloudflare' keeps the service pure-URL (sharp's native CJS can't load
    // in the workerd dev runtime) and uses CF Image Transformations in prod
    service: imageService({ fallbackService: 'cloudflare' }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
