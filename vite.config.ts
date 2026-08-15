import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig, type Plugin } from 'vite';
import solid from '@solidjs/vite-plugin';
import { generatePosts } from './scripts/content-pipeline.mjs';
import { refreshStats } from './scripts/stats-pipeline.mjs';

/**
 * The generated-content pipeline as a plugin: renders blog posts to
 * src/generated/posts.json and refreshes GitHub stats at build start, and
 * re-renders on post edits in dev — the JSON rewrites then hot-reload
 * through Vite's module graph. Running inside Vite means a bare `vite`
 * (or test runner) can never start without the generated files.
 */
const content = (): Plugin => {
  const blogDir = path.resolve('src/content/blog');
  return {
    name: 'palash:content',
    async buildStart() {
      await Promise.all([generatePosts(), refreshStats()]);
    },
    configureServer(server) {
      server.watcher.add(blogDir);
      const regen = (file: string) => {
        if (file.startsWith(blogDir)) void generatePosts();
      };
      server.watcher.on('change', regen);
      server.watcher.on('add', regen);
      server.watcher.on('unlink', regen);
    },
  };
};

export default defineConfig({
  // Turnkey streaming SSR: the plugin generates the entries around
  // src/App.tsx, wrapped in src/Document.tsx. `vite build` emits static
  // client assets to dist/client and the request handler to dist/server;
  // the Cloudflare plugin runs that handler in workerd (wrangler.jsonc
  // points its main at virtual:solid-ssr-handler).
  plugins: [
    content(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    solid({
      start: {
        // Fetch-style chain fronting every request: URL normalization,
        // edge caching, and the API routes (rss.xml, sitemap.xml, …).
        middleware: './src/middleware.ts',
        env: false,
      },
      ssr: true,
      extensions: ['.jsx', '.tsx'],
    }),
    // `httpMethods` also scans route modules for GET/... exports (API
    // routes); handler modules never enter the client bundle.
    fileRoutes({ httpMethods: true, types: true }),
  ],
  server: {
    port: 3000,
    // This machine runs several watcher-heavy tools concurrently. Polling
    // keeps local development working when the shared inotify limit is full.
    watch: {
      usePolling: true,
      interval: 250,
    },
  },
  // Salted into edge-cache keys so a deploy never serves the previous
  // build's cached pages.
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
