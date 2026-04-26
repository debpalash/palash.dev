import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    logoUrl: z.string().url().optional(),
    screenshots: z.array(z.string().url()).default([]),
    icon: z.string().default('🚀'),
    status: z.enum(['live', 'beta', 'coming-soon']).default('live'),
    stack: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { blog, products };
