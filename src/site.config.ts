/**
 * Site configuration for the reading mode (the non-OS half of palash.dev).
 * The retro "Phosphor OS" desktop stays in the Astro repo and keeps serving
 * /os — links to it from here are plain cross-links.
 */

export const SITE = {
  name: 'palash.dev',
  url: 'https://palash.dev',
  title: 'Palash Debnath (debpalash) — Software Engineer & Product Builder',
  description:
    'Palash Debnath (debpalash on GitHub, idebpalash on X) builds VoiceStudio.sh, an open-source ElevenLabs alternative, plus Opal and memXT — local-first tools for AI audio, media, and developer memory.',
  author: 'Palash Debnath',
  /** username / alternate name people also search for */
  handle: 'debpalash',
  alternateName: 'debpalash',
  /** X / Twitter handle — kept separate because it differs from the GitHub one */
  xHandle: 'idebpalash',
  /** image used for the Person entity in structured data */
  avatar: '/avatar-original.png',

  github: 'https://github.com/debpalash',
  x: 'https://x.com/idebpalash',
  email: 'hi@palash.dev',
  /** flagship product — cross-linked site-wide so the two domains form one entity graph */
  voicestudio: 'https://voicestudio.sh',

  links: [
    { label: 'hi@palash.dev', href: 'mailto:hi@palash.dev' },
    { label: 'github.com/debpalash', href: 'https://github.com/debpalash' },
    { label: 'x.com/idebpalash', href: 'https://x.com/idebpalash' },
    { label: 'voicestudio.sh', href: 'https://voicestudio.sh' },
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
    'SolidJS',
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
  },
} as const;
