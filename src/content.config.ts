import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    website: z.string().url().optional(),
    github: z.string().url().optional(),
    stars: z.number().int().nonnegative().optional(),
    license: z.string().optional(),
    pricing: z.enum(['free', 'paid', 'freemium']).optional(),
    openSource: z.boolean().default(false),
    // Product marks may be hosted remotely or bundled as a public asset.
    logoUrl: z.string().url().or(z.string().regex(/^\/(?!\/)/)).optional(),
    /** Optional presentation treatment for the work feed. */
    featured: z.boolean().default(false),
    banner: z.string().url().or(z.string().regex(/^\/(?!\/)/)).optional(),
    workImage: z.string().url().or(z.string().regex(/^\/(?!\/)/)).optional(),
    theme: z.enum(['omnivoice', 'memxt', 'opal']).optional(),
    icon: z.string().default('►'),
    status: z.enum(['live', 'beta', 'coming-soon']).default('live'),
    stack: z.array(z.string()).default([]),
    order: z.number().default(0),
    /** SEO: schema.org SoftwareApplication category, e.g. DeveloperApplication */
    category: z.string().default('DeveloperApplication'),
    /** SEO: supported operating systems, e.g. "macOS, Linux, Windows" */
    os: z.string().default('macOS, Linux, Windows'),
    /** SEO: search phrasings people use for this project */
    keywords: z.array(z.string()).default([]),
  }),
});

const experiments = defineCollection({
  loader: file('./src/content/experiments.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    lang: z.string(),
    stars: z.number().int().nonnegative().default(0),
  }),
});

const gallery = defineCollection({
  loader: file('./src/content/gallery.json'),
  schema: z.object({
    title: z.string(),
    caption: z.string(),
    src: z.string().url(),
    group: z.string(),
  }),
});

const company = defineCollection({
  loader: file('./src/content/company.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    lang: z.string(),
    category: z.string(),
    logoUrl: z.string().url().optional(),
    /** optional window id to open instead of linking out */
    open: z.string().optional(),
  }),
});

export const collections = { blog, products, experiments, gallery, company };
