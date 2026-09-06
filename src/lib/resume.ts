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
import { products, totalStars } from './content';
import { SITE } from '../site.config';

export const RESUME = {
  name: 'Palash Debnath',
  aka: 'debpalash',
  title: 'Software Engineer and Product Builder',
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
    'Software engineer building open-source, local-first tools used by tens of thousands of developers and creators. ' +
    'Owner of the full loop: systems programming (Rust, Zig, CUDA), desktop apps (Tauri), and web (TypeScript, SolidJS, Cloudflare Workers). ' +
    'Flagship project VoiceStudio.sh is an open-source AI voice studio with 19k+ GitHub stars and 70k+ release downloads.',

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
        'Ship and maintain 4 open-source products plus developer tooling; combined 19k+ GitHub stars across the portfolio.',
        'Run the full product loop: architecture, implementation, docs, releases, and community support.',
      ],
    },
  ] as { role: string; org: string; period: string; bullets: string[] }[],

  education: [] as { school: string; detail: string }[],
} as const;

const productById = (id: string) => products.find((p) => p.id === id)!;

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

/** Project bullets — metrics-first, one line each, ATS-safe ASCII. */
export function resumeProjects(): { name: string; tagline: string; bullets: string[] }[] {
  const voice = productById('omnivoice');
  const mem = productById('memxt');
  const opal = productById('opal');
  const boot = productById('bootable');
  return [
    {
      name: 'VoiceStudio.sh — open-source AI voice studio',
      tagline: `${voice.tagline}. ${fmt(voice.stars ?? 0)} stars, ${fmt(voice.downloads ?? 0)} downloads.`,
      bullets: [
        `Desktop studio (Tauri + Python): voice cloning, design, generation, dubbing, dictation, audiobook editor; ${fmt(voice.downloads ?? 0)} stable-release downloads.`,
        'Engine room: 16 TTS + 11 ASR engines, 646 languages; CUDA / Apple MLX / ROCm / CPU; OpenAI-compatible local API + MCP server.',
        `Stack: ${(voice.stack.join(', ') || 'Python, Tauri, CUDA, Docker')}. ${voice.github}.`,
      ],
    },
    {
      name: 'memXT — local-first memory for AI coding agents',
      tagline: `${mem.tagline}.`,
      bullets: [
        'Single static Zig binary: MCP tools + session hooks, local embeddings (llama.cpp), sqlite-vec search (~10 ms wake-up, sub-ms warm search).',
        `Stack: ${mem.stack.join(', ')}. ${mem.github}.`,
      ],
    },
    {
      name: 'Opal — AI media player (Zig)',
      tagline: `${opal.tagline}.`,
      bullets: [
        'One native window for files, sites, servers, feeds; natural-language request-to-playback; plugin endpoints evolve without monolith growth.',
        `Stack: ${opal.stack.join(', ')}. ${opal.github}.`,
      ],
    },
    {
      name: 'Bootable — cross-platform boot media writer (Rust)',
      tagline: 'Write and verify ISO, IMG, RAW, and compressed images on USB or SD media.',
      bullets: [
        'Native desktop app + mouse-enabled TUI; removable-media-only guards, hash + byte verification, cancellable writes.',
        `Stack: ${boot.stack.join(', ')}. ${boot.github}.`,
      ],
    },
  ];
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
    L.push(wrap(p.tagline, 92));
    for (const b of p.bullets) L.push(wrap(`- ${b}`, 92, 2));
    L.push('');
  }
  L.push('WRITING (SELECTED)');
  L.push(wrap('- palash.dev/blog — engineering and product notes (10 posts): shipping fast, building with AI, sovereign/local-first AI, agent memory, voice tech.', 92, 0));
  L.push('');
  if (R.education.length) {
    L.push('EDUCATION');
    for (const e of R.education) L.push(wrap(`${e.school} (${e.detail})`, 92));
    L.push('');
  }
  L.push('LINKS');
  L.push(`- Website: ${R.site}/`);
  L.push(`- GitHub: ${R.github} (19k+ stars, VoiceStudio.sh flagship)`);
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
    L.push(`*${p.tagline}*`);
    for (const b of p.bullets) L.push(`- ${b}`);
    L.push('');
  }
  L.push('## Writing');
  L.push('');
  L.push('- [The Log](https://palash.dev/blog/): 10 posts on shipping, AI-assisted building, sovereign/local-first AI, agent memory, voice tech.');
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
