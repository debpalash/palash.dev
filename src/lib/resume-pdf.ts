/**
 * Minimal PDF 1.4 writer for the ATS resume — zero dependencies.
 * Single column, built-in Helvetica (no embedding), real selectable text,
 * clickable link annotations, document Info metadata, US Letter.
 *
 * The whole file is pure ASCII so string lengths == byte offsets in the
 * xref table (no binary comment, everything escaped).
 */
import { RESUME, resumeContactParts, resumeLocationLine, resumeProjects } from './resume';
import { SITE } from '../site.config';

/* Helvetica advance widths (units per 1000) for printable ASCII. Bold shares
   the table — close enough for conservative wrapping. */
const WIDTHS: Record<string, number> = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
  '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556,
  '@': 1015, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722,
  I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778,
  R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  '[': 278, '\\': 278, ']': 278, '^': 469, _: 556, '`': 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222,
  j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333,
  s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  '{': 334, '|': 260, '}': 334, '~': 584,
};

const widthOf = (text: string, size: number) =>
  [...text].reduce((sum, ch) => sum + (WIDTHS[ch] ?? 556), 0) * (size / 1000);

const sanitize = (text: string): string =>
  text
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .replace(/…/g, '...')
    .replace(/★/g, '*')
    .replace(/⇩/g, 'v')
    .replace(/[^\x20-\x7E]/g, '?');

const escapePdf = (text: string): string =>
  sanitize(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

type Op =
  | { kind: 'text'; font: 'F1' | 'F2'; size: number; x: number; y: number; text: string }
  | { kind: 'rule'; x1: number; x2: number; y: number };

interface LinkBox {
  x0: number;
  x1: number;
  /** baseline, top-down coordinates like text ops */
  y: number;
  size: number;
  url: string;
}

interface Page {
  ops: Op[];
  links: LinkBox[];
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 54;
const TOP_Y = 738;
const BOTTOM_Y = 60;
const MAX_W = PAGE_W - MARGIN_X * 2;

/** URLs, bare emails, and known bare domains become clickable annotations. */
const LINKABLE_RE = /https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:github\.com|x\.com|palash\.dev|voicestudio\.sh)[\w./-]*/g;

function wrapToWidth(text: string, size: number, indent = 0): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    // Wrapped lines carry a hanging indent — reserve it so text never
    // runs past the right margin.
    const effective = lines.length > 0 ? indent : 0;
    if (line && widthOf(trial, size) + effective > MAX_W) {
      lines.push(line);
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function buildResumePdf(): Uint8Array {
  const pages: Page[] = [{ ops: [], links: [] }];
  let page = pages[0];
  let y = TOP_Y;

  const need = (h: number) => {
    if (y - h < BOTTOM_Y) {
      page = { ops: [], links: [] };
      pages.push(page);
      y = TOP_Y;
    }
  };
  const annotate = (ln: string, x: number, size: number) => {
    for (const m of ln.matchAll(LINKABLE_RE)) {
      const raw = m[0].replace(/[.,;:!?]+$/, '');
      if (!raw) continue;
      const start = m.index ?? 0;
      const url = raw.startsWith('http') ? raw : raw.includes('@') ? `mailto:${raw}` : `https://${raw}`;
      const x0 = x + widthOf(ln.slice(0, start), size);
      page.links.push({ x0, x1: x0 + widthOf(raw, size), y, size, url });
    }
  };
  const text = (font: 'F1' | 'F2', size: number, str: string, opts?: { indent?: number; gap?: number; x?: number }) => {
    const wrapped = wrapToWidth(str, size, opts?.indent ?? 0);
    wrapped.forEach((ln, i) => {
      need(size * 1.35);
      y -= size * 1.35;
      // Hanging indent: wrapped lines tuck under the bullet text, not the marker.
      const x = (opts?.x ?? MARGIN_X) + (i > 0 ? (opts?.indent ?? 0) : 0);
      page.ops.push({ kind: 'text', font, size, x, y, text: ln });
      annotate(ln, x, size);
    });
    if (opts?.gap) y -= opts.gap;
  };
  const heading = (str: string) => {
    need(20);
    y -= 8;
    y -= 13;
    page.ops.push({ kind: 'text', font: 'F2', size: 11, x: MARGIN_X, y, text: sanitize(str).toUpperCase() });
    y -= 3;
    page.ops.push({ kind: 'rule', x1: MARGIN_X, x2: PAGE_W - MARGIN_X, y });
    y -= 7;
  };

  // Header
  page.ops.push({ kind: 'text', font: 'F2', size: 18, x: MARGIN_X, y: (y -= 20), text: sanitize(RESUME.name) });
  y -= 4;
  page.ops.push({ kind: 'text', font: 'F1', size: 11, x: MARGIN_X, y: (y -= 14), text: sanitize(RESUME.title) });
  page.ops.push({
    kind: 'text', font: 'F1', size: 9.5, x: MARGIN_X, y: (y -= 13),
    text: sanitize(resumeLocationLine()),
  });
  text('F1', 9.5, resumeContactParts().join(' | '));
  if (RESUME.yearsOfExperience) text('F1', 9.5, `Experience: ${RESUME.yearsOfExperience}`);
  if (RESUME.openTo.length) text('F1', 9.5, `Open to: ${RESUME.openTo.join('; ')}`);
  y -= 4;
  page.ops.push({ kind: 'rule', x1: MARGIN_X, x2: PAGE_W - MARGIN_X, y });
  y -= 6;

  heading('Summary');
  text('F1', 10, RESUME.summary, { gap: 2 });

  heading('Skills');
  for (const s of RESUME.skills) text('F1', 10, `${s.label}: ${s.value}`, { gap: 1 });

  heading('Experience');
  for (const e of RESUME.experience) {
    text('F2', 10.5, `${e.role} - ${e.org} (${e.period})`, { gap: 1 });
    for (const b of e.bullets) text('F1', 10, `- ${b}`, { indent: 10 });
    y -= 2;
  }

  heading('Selected open-source work');
  for (const p of resumeProjects()) {
    text('F2', 10.5, p.name, { gap: 0 });
    text('F1', 9.5, p.tagline, { gap: 1 });
    for (const b of p.bullets) text('F1', 10, `- ${b}`, { indent: 10 });
    y -= 3;
  }

  heading('Writing (selected)');
  text('F1', 10, '- palash.dev/blog - engineering and product notes (10 posts): shipping fast, building with AI, sovereign/local-first AI, agent memory, voice tech.', { gap: 2 });

  if (RESUME.education.length) {
    heading('Education');
    for (const e of RESUME.education) text('F1', 10, `- ${e.school} (${e.detail})`, { gap: 1 });
  }

  heading('Links');
  text('F1', 10, `- Website: ${RESUME.site}/`, { gap: 1 });
  text('F1', 10, `- GitHub: ${RESUME.github} (VoiceStudio.sh flagship)`, { gap: 1 });
  text('F1', 10, `- VoiceStudio.sh: https://voicestudio.sh`, { gap: 1 });
  text('F1', 10, `- Contact: ${RESUME.site}/contact/`, { gap: 6 });

  // Footer on last page
  need(12);
  page.ops.push({
    kind: 'text', font: 'F1', size: 8.5, x: MARGIN_X, y: (y -= 11),
    text: sanitize(`Updated ${RESUME.updated}. Sources: palash.dev, GitHub release/download counts.`),
  });

  // Serialize
  const contents = pages.map((p) => {
    const body = p.ops
      .map((op) =>
        op.kind === 'rule'
          ? `0.55 0.55 0.55 RG 0.6 w ${op.x1} ${op.y.toFixed(1)} m ${op.x2} ${op.y.toFixed(1)} l S`
          : `BT /${op.font} ${op.size} Tf 1 0 0 1 ${op.x.toFixed(1)} ${op.y.toFixed(1)} Tm (${escapePdf(op.text)}) Tj ET`,
      )
      .join('\n');
    return body + '\n';
  });

  const objects: string[] = [];
  // 1 catalog, 2 pages — page/content/annot/font/info objects appended after.
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  const annotObjNums: number[][] = [];
  let next = 3;
  for (const p of pages) {
    pageObjNums.push(next++);
    contentObjNums.push(next++);
    const nums: number[] = [];
    for (let i = 0; i < p.links.length; i++) nums.push(next++);
    annotObjNums.push(nums);
  }
  const fontReg = next++;
  const fontBold = next++;
  const infoNum = next++;

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  pages.forEach((p, i) => {
    const annots = annotObjNums[i];
    objects[pageObjNums[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >> >> ` +
      `/Contents ${contentObjNums[i]} 0 R` +
      (annots.length ? ` /Annots [${annots.map((n) => `${n} 0 R`).join(' ')}]` : '') +
      ` >>`;
    p.links.forEach((link, j) => {
      // Baseline is top-down `y`; PDF rects are bottom-up.
      const bottom = (PAGE_H - link.y - link.size * 0.3).toFixed(1);
      const top = (PAGE_H - link.y + link.size * 0.85).toFixed(1);
      objects[annotObjNums[i][j]] =
        `<< /Type /Annot /Subtype /Link /Rect [${link.x0.toFixed(1)} ${bottom} ${link.x1.toFixed(1)} ${top}] ` +
        `/Border [0 0 0] /A << /S /URI /URI (${escapePdf(link.url)}) >> >>`;
    });
  });
  contents.forEach((body, i) => {
    objects[contentObjNums[i]] = `<< /Length ${body.length} >>\nstream\n${body}endstream`;
  });
  objects[fontReg] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[fontBold] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  objects[infoNum] =
    `<< /Title (${escapePdf(`${RESUME.name} - Resume`)}) ` +
    `/Author (${escapePdf(RESUME.name)}) ` +
    `/Subject (${escapePdf(RESUME.title)}) ` +
    `/Keywords (${escapePdf(SITE.stack.join(', '))}) ` +
    `/Creator (palash.dev resume generator) >>`;

  // Pure ASCII throughout, so character offsets == byte offsets.
  let pdf = '%PDF-1.4\n% palash.dev resume\n';
  const offsets: number[] = [0];
  // objects[0] unused; indices 1..next-1
  for (let n = 1; n < next; n++) {
    offsets[n] = pdf.length;
    pdf += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${next}\n0000000000 65535 f \n`;
  for (let n = 1; n < next; n++) pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${next} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
