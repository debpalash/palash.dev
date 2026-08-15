import type { ParentProps } from 'solid-js';
import { HydrationScript } from '@solidjs/web';
import { SITE } from './site.config';

// Restore the reader's saved light mode before first paint so the page
// never flashes dark. Mirrors the inline script Page.astro shipped.
const modeRestore = [
  'try{',
  "if(localStorage.getItem('palash-mode')==='light'){",
  "document.documentElement.dataset.mode='light';",
  'document.querySelector(\'meta[name="theme-color"]\')?.setAttribute(\'content\',\'#f2efe8\');',
  '}}catch(e){}',
].join('');

/**
 * The document shell — full <html> for every page. Static, site-wide head
 * tags live here; per-page tags (title, canonical, OG, robots) come from
 * <PageMeta> via @solidjs/meta.
 */
export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="alternate" type="text/markdown" title="LLM context" href="/llms.txt" />
        <link rel="alternate" type="text/markdown" title="Full LLM context" href="/llms-full.txt" />
        <link rel="alternate" type="text/plain" title="Humans.txt" href="/humans.txt" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.author} RSS Feed`}
          href="/rss.xml"
        />
        <link rel="me" href={SITE.x} />
        <link rel="me" href={SITE.github} />
        <link rel="author" href={`${SITE.url}/#person`} />
        <meta name="author" content={SITE.author} />
        {/* content-language is a valid hint the RC's http-equiv union omits — spread past the narrow type */}
        <meta {...({ 'http-equiv': 'content-language', content: 'en' } as object)} />
        <meta name="application-name" content="palash.dev" />
        <meta name="theme-color" content="#080a0d" />
        <meta name="format-detection" content="telephone=no" />
        <script innerHTML={modeRestore} />
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
