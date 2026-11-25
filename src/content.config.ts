import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(), description: z.string(), publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(), tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** Who wrote it: shown as a badge on the article and in the list. */
    authorship: z.enum(['human', 'ai-assisted', 'ai']).optional(),
  }),
});
const products = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/products' }),
  schema: z.object({
    name: z.string(), tagline: z.string(), description: z.string(),
    alternateNames: z.array(z.string()).default([]),
    audience: z.string().optional(), positioning: z.string().optional(),
    features: z.array(z.object({ title: z.string(), description: z.string() })).default([]),
    proof: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    tables: z.array(z.object({ eyebrow: z.string(), heading: z.string(), lead: z.string().optional(), columns: z.array(z.string()), rows: z.array(z.array(z.string())), footnote: z.string().optional() })).default([]),
    updatedDate: z.coerce.date().optional(), url: z.url().optional(),
    website: z.url().optional(), github: z.url().optional(),
    stars: z.number().optional(), license: z.string().optional(),
    pricing: z.enum(['free', 'paid', 'freemium']).optional(),
    openSource: z.boolean().default(false), logoUrl: z.string().optional(),
    featured: z.boolean().default(false), banner: z.string().optional(), workImage: z.string().optional(),
    /** Locally cached current home screen and its responsive half-size variant. */
    homeImage: z.string().optional(), homeImageSmall: z.string().optional(),
    theme: z.string().optional(), icon: z.string().default(''),
    status: z.enum(['live', 'alpha', 'beta', 'coming-soon']).default('live'),
    stack: z.array(z.string()).default([]), order: z.number().default(0),
    category: z.string().default('DeveloperApplication'), os: z.string(),
    keywords: z.array(z.string()).default([]),
  }),
});
const gallery = defineCollection({
  loader: file('./src/content/gallery.json'),
  schema: z.object({ title: z.string(), caption: z.string(), src: z.string(), group: z.string() }),
});
export const collections = { blog, products, gallery };
