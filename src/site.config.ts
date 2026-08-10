/**
 * Site + theme configuration.
 *
 * This repo doubles as a reusable "Phosphor OS" Astro theme — fork it,
 * edit this file and the content collections in src/content/, and you
 * have your own retro OS portfolio. Theme colors live in
 * src/styles/global.css (`:root` variables).
 */

export const SITE = {
  name: 'palash.dev',
  url: 'https://palash.dev',
  title: 'Palash Debnath — Software Engineer & Builder',
  description:
    'Portfolio of Palash Debnath — engineer and product builder making tools at the intersection of AI, audio, and infrastructure.',
  author: 'Palash Debnath',
  /** username / alternate name people also search for */
  handle: 'debpalash',
  alternateName: 'debpalash',
  /** image used for the Person entity in structured data */
  avatar: '/avatar-original.png',

  /** Name shown on the boot screen, start button and title bars. */
  osName: 'PALASH.OS',

  /**
   * Theme ids (see the `[data-theme]` blocks in src/styles/global.css and the
   * theme menu in Desktop.astro). One is rolled at random on every page load;
   * an explicit pick from the menu sticks for the tab session. Keep this list
   * in sync with those two places.
   */
  themes: [
    'shaktimaan', 'omarchy', 'xmen97', 'xp', 'paper', 'tiger', 'snow',
    'ice', 'amber', 'phosphor', 'synthwave', 'doom', 'simba',
  ],

  /**
   * Desktop background layers. `mode` is the default; visitors switch layers
   * and cycle wallpapers/videos from the right-click menu (persisted locally).
   * - wallpapers: 4K stills with a slow pan/zoom (files in /public/wallpapers)
   * - videos: ambient YouTube embeds (muted, looped) — loaded only when selected
   */
  background: {
    mode: 'video' as 'starfield' | 'wallpaper' | 'video',
    /** 4K space wallpapers from wallhaven.cc (w/xe8ggz, w/yq8ljg, w/gw7x5l, w/d8wydm) */
    wallpapers: [
      '/wallpapers/space-1.jpg',
      '/wallpapers/space-2.jpg',
      '/wallpapers/space-3.jpg',
      '/wallpapers/space-4.jpg',
    ],
    /** ISRO Official — "Moon Landing Sites" and "Chandrayaan-2 (3D animation)" */
    youtubeIds: ['h87hLynFiaQ', '--8ORixBXQE'],
  },

  github: 'https://github.com/debpalash',
  x: 'https://x.com/idebpalash',
  email: 'hi@palash.dev',

  links: [
    { label: 'hi@palash.dev', href: 'mailto:hi@palash.dev' },
    { label: 'github.com/debpalash', href: 'https://github.com/debpalash' },
    { label: 'x.com/idebpalash', href: 'https://x.com/idebpalash' },
    { label: 'palash.dev', href: 'https://palash.dev' },
    { label: 'rss feed', href: '/rss.xml' },
    { label: 'ko-fi', href: 'https://ko-fi.com/debpalash' },
    { label: 'paypal', href: 'https://paypal.me/palashCoder' },
  ],

  stack: [
    'TypeScript',
    'Rust',
    'Zig',
    'Python',
    'CUDA',
    'Astro',
    'Tailwind v4',
    'Cloudflare Workers',
    'Tauri',
  ],

  company: {
    name: 'YUPCHA',
    url: 'https://yupcha.com',
    tagline: 'Tools that respect your machine and your privacy.',
    blurb:
      'Yupcha builds local-first, privacy-respecting software — desktop apps and developer tools where your data stays on your machine. Open source at its core.',
    products: [
      {
        name: 'hr-tools',
        desc: '60+ offline HR tools — offer letters, payslips, payroll & tax calculators. Local-only AI via Ollama.',
        url: 'https://github.com/debpalash/hr-tools',
      },
      {
        name: 'memxt',
        desc: 'Local-first long-term memory for AI coding agents. Also installed on this OS.',
        open: 'prg-memxt',
      },
    ],
  },

  bootLines: [
    'PALASH.OS v7.0 — PHOSPHOR BIOS (c) 2026',
    'CPU ........................ HUMAN, CAFFEINATED',
    'MEM CHECK .................. 640K OK (ought to be enough)',
    'LOADING WEBTUI.SYS ......... OK',
    'LOADING STARFIELD.DRV ...... OK',
    'LOADING TERMINAL.SYS ....... OK',
    'MOUNTING /PROGRAMS ......... 3 FOUND',
    'MOUNTING /DOCS ............. OK',
    'MOUNTING /COMPANY .......... YUPCHA',
    'BOOT COMPLETE. WELCOME.',
  ],
} as const;
