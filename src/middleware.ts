// The server middleware chain (wired via `start.middleware` in
// vite.config.ts): fetch-style `(request, next)` functions fronting every
// request — URL normalization, edge caching, then the API routes
// (rss.xml.ts, sitemap.xml.ts, llms.txt.ts, …), with everything else
// falling through to the page renderer.
import { createAPIHandler } from 'filesystem-routing/api';
import routes from 'virtual:file-routes';
import { servePostMarkdown } from './lib/post-markdown';

type Middleware = (
  request: Request,
  next: (request?: Request) => Response | Promise<Response>,
) => Response | Promise<Response>;

/**
 * Canonical URLs carry a trailing slash (the form the static site indexed:
 * /omnivoice/, /blog/hello-world/). 301 the bare form so search engines see
 * exactly one URL per page. File-like paths (rss.xml, llms.txt, /assets/…)
 * and the root are left alone.
 */
const normalizeTrailingSlash: Middleware = (request, next) => {
  const url = new URL(request.url);
  const { pathname } = url;
  // The retired desktop edition: indexed and linked for years — keep the equity.
  if (pathname === '/os' || pathname.startsWith('/os/')) {
    url.pathname = '/';
    return Response.redirect(url.href, 301);
  }
  if (pathname !== '/' && !pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(pathname)) {
    url.pathname = `${pathname}/`;
    return Response.redirect(url.href, 301);
  }
  return next(request);
};

/**
 * Edge cache for rendered pages. Content only changes on deploy, so
 * successful GET HTML responses are held in Cloudflare's per-colo cache for
 * 10 minutes (a deploy goes fully live worldwide within that window) and
 * served stale while revalidating for a day. Feeds set their own longer
 * Cache-Control and are cached under the same rules.
 */
const EDGE_HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';

declare const __BUILD_ID__: string;
/** deploy-scoped cache key: a new build can never serve the old build's pages */
const cacheKey = (url: string) => `${url}${url.includes('?') ? '&' : '?'}__v=${__BUILD_ID__}`;

const edgeCache: Middleware = async (request, next) => {
  // Production-only: in dev the local Cache API persists to .wrangler/state
  // and serves stale pages across edits/restarts.
  if (import.meta.env.DEV) return next(request);
  const cacheStore = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (request.method !== 'GET') return next(request);

  const cached = await cacheStore?.match(cacheKey(request.url));
  if (cached) return cached;

  const response = await next(request);
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status !== 200 || response.headers.has('set-cookie')) return response;

  // HTML gets the edge policy stamped on; feeds already declare their own.
  const cacheable = contentType.includes('text/html')
    || /application\/(xml|json|pdf)|text\/(markdown|plain)/.test(contentType);
  if (!cacheable) return response;

  // NEVER buffer the body (no arrayBuffer/text): the SSR renderer settles
  // async work while the stream is being consumed, and draining it eagerly
  // here skips @solidjs/meta's head fill — every page loses <title>/<meta>.
  // Wrap the live stream for the client and let cache.put consume a clone
  // in parallel.
  const headers = new Headers(response.headers);
  if (contentType.includes('text/html')) headers.set('cache-control', EDGE_HTML_CACHE_CONTROL);
  const finished = new Response(response.body, { status: 200, headers });
  if (cacheStore) {
    const forCache = finished.clone();
    void cacheStore.put(cacheKey(request.url), forCache).catch(() => {});
  }
  return finished;
};

const postMarkdown: Middleware = (request, next) =>
  servePostMarkdown(request) ?? next(request);

export default [normalizeTrailingSlash, edgeCache, postMarkdown, createAPIHandler(routes)];
