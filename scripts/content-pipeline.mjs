/**
 * Build-time content pipeline: renders src/content/blog/*.{md,mdx} to HTML
 * once, at build, so the Worker ships zero markdown/shiki weight and serves
 * deterministic markup.
 *
 * Output: src/generated/posts.json — [{ id, title, description, publishDate,
 * updatedDate?, tags, draft, body, html, wordCount }] sorted newest-first.
 *
 * The pipeline mirrors what Astro did for these posts: GFM + smart quotes,
 * heading ids, and shiki code blocks in github-dark-default.
 *
 * Consumed by the `palash:content` Vite plugin (vite.config.ts) at build
 * start and on blog-file changes in dev; `npm run gen` runs it standalone.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const blogDir = path.join(root, 'src/content/blog');
const outFile = path.join(root, 'src/generated/posts.json');

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeShiki, { theme: 'github-dark-default', defaultLanguage: 'plaintext' })
  .use(rehypeStringify);

/** single-flight: concurrent build environments share one render pass */
let inflight = null;

export function generatePosts() {
  inflight ??= run().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function run() {
  const files = (await readdir(blogDir)).filter((f) => /\.(md|mdx)$/.test(f));
  const posts = [];

  for (const file of files) {
    const source = await readFile(path.join(blogDir, file), 'utf8');
    const { data, content } = matter(source);
    const body = content.trim();
    const html = String(await processor.process(body));
    posts.push({
      id: file.replace(/\.(md|mdx)$/, ''),
      title: data.title,
      description: data.description,
      publishDate: new Date(data.publishDate).toISOString(),
      updatedDate: data.updatedDate ? new Date(data.updatedDate).toISOString() : undefined,
      tags: data.tags ?? [],
      draft: data.draft ?? false,
      body,
      html,
      wordCount: body.split(/\s+/).filter(Boolean).length,
    });
  }

  posts.sort((a, b) => new Date(b.publishDate).valueOf() - new Date(a.publishDate).valueOf());

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(posts, null, 2));
  return posts.length;
}
