/**
 * The content layer — the Astro content collections, as plain typed modules.
 * Products/experiments/gallery/company are the same JSON files; blog posts
 * come pre-rendered from scripts/gen-content.mjs (see src/generated).
 */
import omnivoice from '../content/products/omnivoice.json';
import bootable from '../content/products/bootable.json';
import memxt from '../content/products/memxt.json';
import opal from '../content/products/opal.json';
import experimentsJson from '../content/experiments.json';
import galleryJson from '../content/gallery.json';
import companyJson from '../content/company.json';
import postsJson from '../generated/posts.json';
import statsJson from '../generated/stats.json';

export interface ProductTable {
  eyebrow: string;
  heading: string;
  lead?: string;
  columns: string[];
  rows: string[][];
  footnote?: string;
}

export interface Product {
  id: string;
  name: string;
  alternateNames: string[];
  tagline: string;
  description: string;
  audience?: string;
  positioning?: string;
  features: { title: string; description: string }[];
  proof: { value: string; label: string }[];
  /** data-driven spec/comparison tables rendered on the product page */
  tables: ProductTable[];
  updatedDate?: Date;
  url?: string;
  website?: string;
  github?: string;
  stars?: number;
  /** total release-asset downloads, refreshed at build (scripts/refresh-stats.mjs) */
  downloads?: number;
  license?: string;
  pricing?: 'free' | 'paid' | 'freemium';
  openSource: boolean;
  logoUrl?: string;
  featured: boolean;
  banner?: string;
  workImage?: string;
  theme?: string;
  icon: string;
  status: 'live' | 'alpha' | 'beta' | 'coming-soon';
  stack: string[];
  order: number;
  category: string;
  os: string;
  keywords: string[];
}

export interface Post {
  id: string;
  title: string;
  description: string;
  publishDate: Date;
  updatedDate?: Date;
  tags: string[];
  body: string;
  html: string;
  wordCount: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  url: string;
  lang: string;
  stars: number;
}

export interface GalleryShot {
  id: string;
  title: string;
  caption: string;
  src: string;
  group: string;
}

export interface CompanyProject {
  id: string;
  name: string;
  description: string;
  url: string;
  lang: string;
  category: string;
}

const defaults = {
  alternateNames: [] as string[],
  features: [] as { title: string; description: string }[],
  proof: [] as { value: string; label: string }[],
  tables: [] as ProductTable[],
  openSource: false,
  featured: false,
  icon: '►',
  status: 'live' as const,
  stack: [] as string[],
  order: 0,
  category: 'DeveloperApplication',
  os: 'macOS, Linux, Windows',
  keywords: [] as string[],
};

type Stats = {
  products: Record<string, { stars?: number; downloads?: number } | undefined>;
  experiments: Record<string, { stars?: number } | undefined>;
};
const stats = statsJson as Stats;

const toProduct = (id: string, raw: Record<string, unknown>): Product => ({
  ...defaults,
  ...(raw as object),
  id,
  updatedDate: raw.updatedDate ? new Date(raw.updatedDate as string) : undefined,
  // live numbers win over whatever the content JSON hardcodes
  stars: stats.products[id]?.stars ?? (raw.stars as number | undefined),
  downloads: stats.products[id]?.downloads || undefined,
}) as Product;

/** Work-tab order (the `order` field), same as the Astro sort. */
export const products: Product[] = [
  toProduct('omnivoice', omnivoice),
  toProduct('bootable', bootable),
  toProduct('memxt', memxt),
  toProduct('opal', opal),
].sort((a, b) => a.order - b.order);

export const productById = (id: string) => products.find((p) => p.id === id);

/** Published posts, newest first (drafts excluded, like the Astro filter). */
export const posts: Post[] = postsJson
  .filter((p) => !p.draft)
  .map((p) => ({
    ...p,
    publishDate: new Date(p.publishDate),
    updatedDate: p.updatedDate ? new Date(p.updatedDate) : undefined,
  }));

export const postById = (id: string) => posts.find((p) => p.id === id);

/** Sorted by id — the same order Astro's file loader returned them in. */
export const experiments: Experiment[] = [...experimentsJson]
  .map((x) => ({ ...x, stars: stats.experiments[x.id]?.stars ?? x.stars }))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
export const gallery: GalleryShot[] = galleryJson;
export const company: CompanyProject[] = companyJson as CompanyProject[];

export const totalStars =
  products.reduce((sum, p) => sum + (p.stars ?? 0), 0) +
  experiments.reduce((sum, x) => sum + (x.stars ?? 0), 0);
