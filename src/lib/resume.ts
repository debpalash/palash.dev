/**
 * Resume — single source of truth for every ATS surface:
 *   /resume/          HTML (print-friendly, links to the files below)
 *   /resume.txt       plain text (ATS paste-in / parse test)
 *   /resume.llm.txt   markdown (LLM-optimized, same facts)
 *   /resume.pdf       single-column PDF, real selectable text (ATS upload)
 *
 * TODO (fill in before sending — facts only, no fabrication):
 *  - phone — renders into every contact block once set
 *  - yearsOfExperience, e.g. '6+ years'
 *  - workAuthorization, e.g. 'Authorized to work in India; open to remote worldwide'
 *  - education — add { school, detail } entries; section stays hidden while empty
 *  - employment history beyond independent OSS: add entries to `experience`
 *    (example shape below) with company, title, period, and quantified bullets
 *  - per application: mirror the job description's keywords into summary/skills,
 *    rebuild, and send that PDF — one source file, all five outputs regenerate
 *
 * Live numbers (stars/downloads) are read from the same generated stats as
 * the site, so the resume never drifts from palash.dev.
 */
import { products, totalStars, totalDownloads, posts, experiments, latestRelease } from './content';

const compactNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);
import { SITE } from '../site.config';

export const RESUME = {
  name: 'Palash Debnath',
  aka: 'debpalash',
  title: 'Agentic Software Designer and Software Engineer',
  location: 'Agartala, Tripura, India — open to remote',
  timezone: 'IST (UTC+5:30)',
  /** e.g. 'Authorized to work in India; open to remote worldwide' */
  workAuthorization: '',
  /** e.g. '+91-XXXXXXXXXX' — empty stays off every output */
  phone: '',
  /** e.g. '6+ years' — empty stays off every output */
  yearsOfExperience: '',
  /** roles you want — HR keyword match + agent matching */
  openTo: [
    'Senior Software Engineer',
    'AI / ML Engineer',
    'Systems Engineer (Rust / Zig)',
    'Full-Stack Product Engineer',
  ],
  email: SITE.email,
  site: 'https://palash.dev',
  github: SITE.github,
  githubHandle: 'github.com/debpalash',
  x: SITE.x,
  updated: new Date().toISOString().split('T')[0],

  summary:
    `Founder of YUPCHA, based in Agartala, India. I design AI agents and build open-source, local-first desktop apps and developer tools: ` +
    `${products.length} shipped products with ${compactNum(totalStars)}+ GitHub stars and ${compactNum(totalDownloads)}+ release downloads. ` +
    'I own the full loop: systems work in Rust, Zig, and CUDA; desktop apps; web on TypeScript and Cloudflare Workers; releases and support. ' +
    `Flagship: VoiceStudio.sh, an open-source local AI voice studio (${compactNum(products.find((p) => p.id === 'omnivoice')?.stars ?? 0)}+ stars).`,

  skills: [
    { label: 'Languages', value: 'TypeScript, Rust, Zig, Python, Go, SQL' },
    { label: 'AI / audio', value: 'TTS + ASR pipelines (16 TTS / 11 ASR engines), Whisper, CUDA, MLX, llama.cpp, MCP servers, agent memory (sqlite-vec)' },
    { label: 'Systems', value: 'Tauri desktop apps, GPU offload (CUDA / MPS / ROCm), Docker, static binaries, UEFI / boot media' },
    { label: 'Web', value: 'SolidJS, Cloudflare Workers (streaming SSR), Vite, edge caching, SEO / structured data' },
  ] as { label: string; value: string }[],

  // Independent OSS work — the verifiable record. Add employed roles above
  // this list, e.g.:
  //   {
  //     role: 'Senior Software Engineer',
  //     org: 'Company — team / scope (e.g. 4 engineers, payments platform)',
  //     period: '2021 — 2024',
  //     bullets: [
  //       'Led X: quantified outcome (latency -40%, 2M req/day, $Y revenue).',
  //       'Scope: team size, budget, systems owned, hiring/mentoring.',
  //     ],
  //   },
  experience: [
    {
      role: 'Founder and Independent Open-Source Builder',
      org: 'YUPCHA — local-first, privacy-respecting software',
      period: 'Present',
      bullets: [
        `Ship and maintain ${products.length} open-source products and ${experiments.length} smaller public repos; ${compactNum(totalStars)}+ GitHub stars and ${compactNum(totalDownloads)}+ stable-release downloads combined.`,
        'Run the full product loop: architecture, implementation, docs, releases, and community support.',
        `Write about engineering and AI at palash.dev (${posts.length} articles).`,
      ],
    },
  ] as { role: string; org: string; period: string; bullets: string[] }[],

  education: [] as { school: string; detail: string }[],
} as const;

/** Contact block — phone joins only when set. One helper, every output agrees. */
export function resumeContactParts(): string[] {
  const R = RESUME;
  return [R.email, R.phone || '', R.site, R.githubHandle, 'x.com/idebpalash'].filter(Boolean);
}

/** Location line — timezone and work authorization append only when set. */
export function resumeLocationLine(): string {
  const R = RESUME;
  return [R.location, R.timezone, R.workAuthorization || ''].filter(Boolean).join(' · ');
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);

/** Short month + year for release dates, e.g. "Sep 2026". */
const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Hand-written detail per product; anything missing falls back to the product's own copy. */
const PROJECT_NOTES: Record<string, { name: string; bullets: string[] }> = {
  omnivoice: {
    name: 'VoiceStudio.sh - open-source local AI voice studio',
    bullets: [
      'Desktop studio for voice cloning, voice design, generation, dubbing, dictation, and audiobooks; runs locally, no subscription.',
      'Engine layer: 16 TTS + 11 ASR engines across 646 languages on CUDA, Apple MLX, ROCm, or CPU; OpenAI-compatible local API and MCP server.',
    ],
  },
  memxt: {
    name: 'memXT - local-first memory for AI coding agents',
    bullets: ['Single static Zig binary: MCP tools and session hooks, local embeddings (llama.cpp), sqlite-vec search; ~10 ms wake-up, sub-ms warm search.'],
  },
  opal: {
    name: 'Opal - AI media player (Zig)',
    bullets: ['One native window for files, sites, servers, and feeds; natural-language request-to-playback; plugin endpoints evolve without growing the core.'],
  },
  bootable: {
    name: 'Bootable - cross-platform boot media writer (Rust)',
    bullets: ['Native desktop app and mouse-enabled TUI; removable-media-only guards, hash and byte verification, cancellable writes; Linux, Windows, macOS.'],
  },
  opengtm: {
    name: 'OpenGTM - self-hosted lead sourcing and enrichment',
    bullets: ['Lead sourcing, enrichment waterfalls, AI research, and activation in one self-hosted workspace; bring-your-own keys with cost estimates before each run.'],
  },
  friday: {
    name: 'Friday - local-first voice assistant for Linux',
    bullets: ['Voice and text assistant on local models (Qwen, Parakeet, Piper) with SQLite memory and bounded tool families; no required hosted calls.'],
  },
};

/** Project entries - metrics-first, ATS-safe. Every product, in site order. */
export function resumeProjects(): { id: string; name: string; tagline: string; meta: string; bullets: string[] }[] {
  return products.map((p) => {
    const note = PROJECT_NOTES[p.id];
    const release = latestRelease(p.id);
    const meta = [
      p.stars ? `${fmt(p.stars)} stars` : '',
      p.downloads ? `${fmt(p.downloads)} downloads` : '',
      release ? `${release.tag}, ${monthYear(release.publishedAt)}` : p.status === 'live' ? '' : p.status,
    ].filter(Boolean).join(' - ');
    return {
      id: p.id,
      name: note?.name ?? `${p.name} - ${p.tagline}`,
      tagline: `${p.tagline}.`.replace(/\.\.$/, '.'),
      meta,
      bullets: [
        ...(note?.bullets ?? [p.description]),
        `Stack: ${p.stack.join(', ')}. ${p.github ?? p.url}`,
      ],
    };
  });
}

/** Other public repos worth a line: the most-starred Lab entries. */
export function resumeOtherRepos(limit = 6): string {
  return [...experiments].sort((a, b) => b.stars - a.stars).slice(0, limit).map((r) => r.name).join(', ');
}

/** Headline numbers for the header strip. */
export function resumeHighlights(): string[] {
  return [
    `${fmt(totalStars)}+ GitHub stars`,
    `${fmt(totalDownloads)}+ release downloads`,
    `${products.length} shipped products`,
    `${posts.length} articles`,
  ];
}

/** Structured resume for agents - stable keys, safe to parse without an LLM. */
export function resumeData() {
  const R = RESUME;
  return {
    name: R.name,
    aka: R.aka,
    title: R.title,
    location: resumeLocationLine(),
    email: R.email,
    ...(R.phone ? { phone: R.phone } : {}),
    ...(R.yearsOfExperience ? { yearsOfExperience: R.yearsOfExperience } : {}),
    timezone: R.timezone,
    ...(R.workAuthorization ? { workAuthorization: R.workAuthorization } : {}),
    openTo: R.openTo,
    contacts: resumeContactParts(),
    site: `${R.site}/`,
    github: R.github,
    x: R.x,
    summary: R.summary,
    highlights: resumeHighlights(),
    skills: R.skills,
    experience: R.experience,
    projects: resumeProjects(),
    education: R.education,
    links: {
      resumeHtml: `${R.site}/resume/`,
      resumePdf: `${R.site}/resume.pdf`,
      resumeTxt: `${R.site}/resume.txt`,
      resumeLlm: `${R.site}/resume.llm.txt`,
      resumeJson: `${R.site}/resume.json`,
    },
    portfolioStars: totalStars,
    portfolioDownloads: totalDownloads,
    updated: R.updated,
  };
}

/** The same facts in the JSON Resume schema (jsonresume.org), for ATS and agent tooling. */
export function resumeJsonResume() {
  const R = RESUME;
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: R.name,
      label: R.title,
      email: R.email,
      ...(R.phone ? { phone: R.phone } : {}),
      url: `${R.site}/`,
      summary: R.summary,
      location: { city: 'Agartala', region: 'Tripura', countryCode: 'IN' },
      profiles: [
        { network: 'GitHub', username: R.aka, url: R.github },
        { network: 'X', username: 'idebpalash', url: R.x },
      ],
    },
    work: R.experience.map((e) => ({ name: e.org.split(' - ')[0].split(' — ')[0], position: e.role, summary: e.org, highlights: e.bullets, ...(e.period === 'Present' ? {} : { startDate: e.period }) })),
    projects: products.map((p) => ({
      name: p.name,
      description: p.tagline,
      url: p.github ?? p.url,
      ...(p.website ? { website: p.website } : {}),
      keywords: p.stack,
      highlights: resumeProjects().find((r) => r.id === p.id)?.bullets.slice(0, -1) ?? [],
      ...(p.stars ? { stars: p.stars } : {}),
      ...(p.downloads ? { downloads: p.downloads } : {}),
    })),
    skills: R.skills.map((s) => ({ name: s.label, keywords: s.value.split(/,\s*/) })),
    education: R.education.map((e) => ({ institution: e.school, studyType: e.detail })),
    meta: { canonical: `${R.site}/resume.json`, lastModified: R.updated, version: '1.0.0' },
  };
}

export function resumeTotalStars(): number {
  return totalStars;
}

/** Plain-text ATS resume — ASCII only, 80-col friendly, no art. */
export function renderResumeTxt(): string {
  const ascii = (s: string): string =>
    s
      .replace(/[—–]/g, '-')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/·/g, '-')
      .replace(/…/g, '...')
      .replace(/[^\x20-\x7E\n]/g, '?');
  const R = RESUME;
  const L: string[] = [];
  L.push(R.name.toUpperCase());
  L.push(R.title);
  L.push(resumeHighlights().join(' | '));
  L.push(wrap(resumeLocationLine(), 92));
  L.push(wrap(resumeContactParts().join(' | '), 92));
  if (R.yearsOfExperience) L.push(`Experience: ${R.yearsOfExperience}`);
  if (R.openTo.length) L.push(wrap(`Open to: ${R.openTo.join('; ')}`, 92));
  L.push('');
  L.push('SUMMARY');
  L.push(wrap(R.summary, 92));
  L.push('');
  L.push('SKILLS');
  for (const s of R.skills) L.push(wrap(`${s.label}: ${s.value}`, 92));
  L.push('');
  L.push('EXPERIENCE');
  for (const e of R.experience) {
    L.push(`${e.role} — ${e.org} (${e.period})`);
    for (const b of e.bullets) L.push(wrap(`- ${b}`, 92, 2));
  }
  L.push('');
  L.push('SELECTED OPEN-SOURCE WORK');
  for (const p of resumeProjects()) {
    L.push(p.name);
    L.push(wrap([p.tagline, p.meta].filter(Boolean).join(' '), 92));
    for (const b of p.bullets) L.push(wrap(`- ${b}`, 92, 2));
    L.push('');
  }
  L.push(wrap(`Other public repos: ${resumeOtherRepos()}.`, 92));
  L.push('');
  L.push('WRITING (SELECTED)');
  L.push(wrap(`- palash.dev/blog — ${posts.length} articles, including: ${posts.slice(0, 3).map((p) => p.title).join('; ')}.`, 92, 2));
  L.push('');
  if (R.education.length) {
    L.push('EDUCATION');
    for (const e of R.education) L.push(wrap(`${e.school} (${e.detail})`, 92));
    L.push('');
  }
  L.push('LINKS');
  L.push(`- Website: ${R.site}/`);
  L.push(`- GitHub: ${R.github} (${fmt(totalStars)}+ stars, VoiceStudio.sh flagship)`);
  L.push(`- VoiceStudio.sh: https://voicestudio.sh`);
  L.push(`- Contact: ${R.site}/contact/`);
  L.push('');
  L.push(`Updated ${R.updated}. Sources: palash.dev, GitHub release/download counts.`);
  return ascii(L.join('\n')).replace(/\n{3,}/g, '\n\n') + '\n';
}

/** LLM-optimized markdown — same facts, richer links. */
export function renderResumeLlm(): string {
  const R = RESUME;
  const L: string[] = [];
  L.push(`# ${R.name} — ${R.title}`);
  L.push('');
  L.push(`> ${R.summary}`);
  L.push('');
  L.push(`**${resumeHighlights().join(' · ')}**`);
  L.push('');
  L.push(`- Location: ${resumeLocationLine()}`);
  L.push(`- Email: ${R.email}`);
  if (R.phone) L.push(`- Phone: ${R.phone}`);
  if (R.yearsOfExperience) L.push(`- Experience: ${R.yearsOfExperience}`);
  if (R.workAuthorization) L.push(`- Work authorization: ${R.workAuthorization}`);
  if (R.openTo.length) L.push(`- Open to: ${R.openTo.join('; ')}`);
  L.push(`- Website: ${R.site}/`);
  L.push(`- GitHub: ${R.github} (@${R.aka}, ${fmt(resumeTotalStars())}+ stars across portfolio)`);
  L.push(`- X: ${R.x}`);
  L.push(`- Resume files: ${R.site}/resume.pdf · ${R.site}/resume.txt · ${R.site}/resume.llm.txt`);
  L.push('');
  L.push('## Skills');
  L.push('');
  for (const s of R.skills) L.push(`- **${s.label}**: ${s.value}`);
  L.push('');
  L.push('## Experience');
  L.push('');
  for (const e of R.experience) {
    L.push(`### ${e.role} — ${e.org} (${e.period})`);
    for (const b of e.bullets) L.push(`- ${b}`);
    L.push('');
  }
  L.push('## Selected open-source work');
  L.push('');
  for (const p of resumeProjects()) {
    L.push(`### ${p.name}`);
    L.push(`*${p.tagline}*${p.meta ? ` (${p.meta})` : ''}`);
    for (const b of p.bullets) L.push(`- ${b}`);
    L.push('');
  }
  L.push('## Writing');
  L.push('');
  L.push(`- [Writing](https://palash.dev/blog/): ${posts.length} articles, including ${posts.slice(0, 3).map((p) => `[${p.title}](https://palash.dev/blog/${p.id}/)`).join(', ')}.`);
  L.push('');
  L.push(`Other public repos: ${resumeOtherRepos()}.`);
  L.push('');
  if (R.education.length) {
    L.push('## Education');
    L.push('');
    for (const e of R.education) L.push(`- **${e.school}** (${e.detail})`);
    L.push('');
  }
  L.push('## Links');
  L.push('');
  L.push(`- [palash.dev](https://palash.dev/) · [contact](https://palash.dev/contact/) · [VoiceStudio.sh](https://voicestudio.sh) · [GitHub](https://github.com/debpalash)`);
  return L.join('\n');
}

function wrap(text: string, width: number, hanging = 0): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  const pad = ' '.repeat(hanging);
  for (const w of words) {
    const trial = line ? `${line} ${w}` : (lines.length ? pad + w : w);
    if (trial.length > width && line) {
      lines.push(line);
      line = pad + w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}
