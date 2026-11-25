/**
 * Resume PDF writer - zero dependencies, pure ASCII output.
 *
 * Layout follows the common LaTeX resume template (Jake's Resume): Times,
 * small-caps name and section headings with a rule, bold entry titles with
 * dates flush right, italic sub-rows, and tight bullets. For ATS and agents:
 * one column, standard section names, real selectable text in WinAnsi
 * encoding, clickable links, document metadata, and the JSON Resume file
 * attached (application/json, AFRelationship /Data).
 */
import { RESUME, resumeJsonResume, resumeHighlights, resumeProjects } from './resume';
import { posts, products } from './content';

type Font = 'R' | 'B' | 'I';

/* Placeholder bytes for the few non-ASCII glyphs we draw; escapePdf turns them into WinAnsi octal codes. */
const EN = '\x01';
const EM = '\x02';
const BULLET = '\x03';
const MIDDOT = '\x04';
const E_ACUTE = '\x05';
const WINANSI: Record<string, string> = { [EN]: '\\226', [EM]: '\\227', [BULLET]: '\\225', [MIDDOT]: '\\267', [E_ACUTE]: '\\351' };

/* Adobe Times advance widths (1/1000 em) for printable ASCII. */
const ASCII = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const table = (widths: number[], extra: number[]) => {
  const map: Record<string, number> = {};
  [...ASCII].forEach((ch, i) => { map[ch] = widths[i]; });
  [EN, EM, BULLET, MIDDOT, E_ACUTE].forEach((ch, i) => { map[ch] = extra[i]; });
  return map;
};
const WIDTHS: Record<Font, Record<string, number>> = {
  R: table([
    250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
    278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667,
    556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500,
    278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
  ], [500, 1000, 350, 250, 444]),
  B: table([
    250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
    333, 333, 570, 570, 570, 500, 930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778, 611, 778, 722,
    556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500, 333, 500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556,
    278, 833, 556, 500, 556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520,
  ], [500, 1000, 350, 250, 444]),
  I: table([
    250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
    333, 333, 675, 675, 675, 500, 920, 611, 611, 667, 722, 611, 611, 722, 722, 333, 444, 667, 556, 833, 667, 722, 611, 722, 611,
    500, 556, 722, 611, 833, 611, 556, 556, 389, 278, 389, 422, 500, 333, 500, 500, 444, 500, 444, 278, 500, 500, 278, 278, 444,
    278, 722, 500, 500, 500, 500, 389, 389, 278, 500, 444, 667, 444, 444, 389, 400, 275, 400, 541,
  ], [500, 889, 350, 250, 444]),
};
/* oxlint-disable no-control-regex -- Control bytes 1–5 are temporary WinAnsi glyph markers. */
const NON_PDF_ASCII = new RegExp('[^\\x01-\\x05\\x20-\\x7E]', 'g');
const WINANSI_MARKERS = new RegExp('[\\x01-\\x05]', 'g');
const NON_ASCII = new RegExp('[^\\x00-\\x7F]', 'g');
/* oxlint-enable no-control-regex */

const sanitize = (text: string): string =>
  text
    .replace(/–/g, EN).replace(/—/g, EM).replace(/•/g, BULLET).replace(/·/g, MIDDOT).replace(/é/g, E_ACUTE)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[★⇩]/g, '')
    .replace(NON_PDF_ASCII, '?');

const widthOf = (text: string, size: number, font: Font = 'R') =>
  [...text].reduce((sum, ch) => sum + (WIDTHS[font][ch] ?? 500), 0) * (size / 1000);

const escapePdf = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(WINANSI_MARKERS, (c) => WINANSI[c]);

/** Keep the attached JSON pure ASCII so string offsets equal byte offsets. */
const asciiJson = (value: unknown) => JSON.stringify(value, null, 2).replace(NON_ASCII, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

type Op =
  | { kind: 'text'; font: Font; size: number; x: number; y: number; text: string; gray?: number }
  | { kind: 'rule'; x1: number; x2: number; y: number; width: number };
interface Link { x0: number; x1: number; y: number; size: number; url: string }
interface Page { ops: Op[]; links: Link[] }

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 40;
const TOP_Y = PAGE_H - 36;
const BOTTOM_Y = 44;
const RIGHT = PAGE_W - MARGIN_X;
const BODY = 10.2;
const LEAD = 1.2;

/** URLs, bare emails, and known bare domains become clickable annotations. */
const LINKABLE_RE = /https?:\/\/[^\s)|]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:github\.com|x\.com|palash\.dev|voicestudio\.sh)[\w./-]*/g;

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
  const draw = (font: Font, size: number, x: number, str: string, gray?: number) => {
    page.ops.push({ kind: 'text', font, size, x, y, text: str, gray });
    for (const m of str.matchAll(LINKABLE_RE)) {
      const raw = m[0].replace(/[.,;:!?]+$/, '');
      if (!raw) continue;
      const url = raw.startsWith('http') ? raw : raw.includes('@') ? `mailto:${raw}` : `https://${raw}`;
      const x0 = x + widthOf(str.slice(0, m.index ?? 0), size, font);
      page.links.push({ x0, x1: x0 + widthOf(raw, size, font), y, size, url });
    }
    return x + widthOf(str, size, font);
  };
  const wrap = (str: string, size: number, font: Font, width: number): string[] => {
    const lines: string[] = [];
    let line = '';
    for (const word of str.split(/\s+/).filter(Boolean)) {
      const trial = line ? `${line} ${word}` : word;
      if (line && widthOf(trial, size, font) > width) { lines.push(line); line = word; } else line = trial;
    }
    if (line) lines.push(line);
    return lines;
  };
  const newline = (size = BODY) => { need(size * LEAD); y -= size * LEAD; };
  const center = (font: Font, size: number, str: string, gray?: number) => {
    const s = sanitize(str);
    draw(font, size, (PAGE_W - widthOf(s, size, font)) / 2, s, gray);
  };
  const flushRight = (font: Font, size: number, str: string) => {
    const s = sanitize(str);
    draw(font, size, RIGHT - widthOf(s, size, font), s);
  };
  /** Small caps like LaTeX \scshape: capitals at full size, lowercase as smaller capitals. */
  const smallCaps = (str: string, size: number, x: number, measure = false) => {
    let cx = x;
    for (const part of sanitize(str).match(/[a-z]+|[^a-z]+/g) ?? []) {
      const lower = /^[a-z]/.test(part);
      const s = lower ? size * 0.78 : size;
      const t = lower ? part.toUpperCase() : part;
      if (!measure) page.ops.push({ kind: 'text', font: 'R', size: s, x: cx, y, text: t });
      cx += widthOf(t, s, 'R');
    }
    return cx - x;
  };
  const section = (title: string) => {
    need(40);
    y -= 7;
    newline(12);
    smallCaps(title, 12, MARGIN_X);
    y -= 3.5;
    page.ops.push({ kind: 'rule', x1: MARGIN_X, x2: RIGHT, y, width: 0.5 });
    y -= 1;
  };
  const paragraph = (str: string, font: Font = 'R', size = BODY, x = MARGIN_X) => {
    for (const ln of wrap(sanitize(str), size, font, RIGHT - x)) { newline(size); draw(font, size, x, ln); }
  };
  const bullets = (items: string[]) => {
    for (const item of items) {
      const lines = wrap(sanitize(item), BODY, 'R', RIGHT - (MARGIN_X + 20));
      need(BODY * LEAD * Math.min(lines.length, 2));
      lines.forEach((ln, i) => {
        newline();
        if (i === 0) draw('R', BODY, MARGIN_X + 9, BULLET);
        draw('R', BODY, MARGIN_X + 20, ln);
      });
    }
    y -= 2.5;
  };
  /** Two-row entry heading: bold left + right, italic left + right. */
  const entry = (title: string, right: string, sub?: string, subRight?: string) => {
    need(BODY * LEAD * 3);
    newline(10.8);
    draw('B', 10.8, MARGIN_X, sanitize(title));
    if (right) flushRight('R', BODY, right);
    if (sub || subRight) {
      newline();
      if (sub) draw('I', BODY, MARGIN_X, sanitize(sub));
      if (subRight) flushRight('I', BODY, subRight);
    }
  };

  // Heading: centered small-caps name, target title, one contact line.
  y -= 6;
  newline(26);
  const nameW = smallCaps(RESUME.name, 26, 0, true);
  smallCaps(RESUME.name, 26, (PAGE_W - nameW) / 2);
  y -= 3;
  newline(11.5);
  center('I', 11.5, RESUME.title);
  newline(BODY);
  const contact = ['Agartala, India (Remote)', RESUME.email, 'palash.dev', RESUME.githubHandle, 'x.com/idebpalash', RESUME.phone].filter(Boolean).join('  |  ');
  center('R', BODY, contact);
  newline(9.5);
  center('R', 9.5, resumeHighlights().join('  ·  '), 0.3);

  section('Summary');
  paragraph(RESUME.summary);

  section('Experience');
  for (const e of RESUME.experience) {
    const [org, note] = e.org.split(/\s+[—-]\s+/);
    entry(org, e.period, e.role, note ? note.charAt(0).toUpperCase() + note.slice(1) : 'Remote');
    bullets(e.bullets);
  }

  section('Projects');
  for (const p of resumeProjects()) {
    const product = products.find((x) => x.id === p.id);
    const name = product?.name ?? p.name.split(' - ')[0];
    const stack = product?.stack.join(', ') ?? '';
    need(BODY * LEAD * 3);
    newline(10.8);
    const x = draw('B', 10.8, MARGIN_X, sanitize(name));
    const repo = product?.github ?? product?.url;
    if (repo) page.links.push({ x0: MARGIN_X, x1: x, y, size: 10.8, url: repo });
    const metaText = sanitize(p.meta.replace(/ - /g, ' · '));
    const room = RIGHT - widthOf(metaText, BODY, 'R') - 14 - x;
    if (stack) {
      const sep = draw('R', BODY, x, '  |  ');
      let s = sanitize(stack);
      while (s && widthOf(s, BODY, 'I') > room - (sep - x)) s = s.replace(/,?\s*[^,]*$/, '');
      if (s) draw('I', BODY, sep, s);
    }
    if (metaText) flushRight('R', BODY, metaText);
    bullets(p.bullets.slice(0, -1));
  }

  section('Technical Skills');
  for (const s of RESUME.skills) {
    const label = sanitize(`${s.label}: `);
    const lines = wrap(sanitize(s.value), BODY, 'R', RIGHT - MARGIN_X - widthOf(label, BODY, 'B'));
    lines.forEach((ln, i) => {
      newline();
      const x = i === 0 ? draw('B', BODY, MARGIN_X, label) : MARGIN_X + widthOf(label, BODY, 'B');
      draw('R', BODY, x, ln);
    });
  }
  y -= 2;

  if (RESUME.education.length) {
    section('Education');
    for (const e of RESUME.education) entry(e.school, '', e.detail);
  }

  section('Writing');
  paragraph(`${posts.length} articles on engineering, AI, and local-first software at palash.dev/blog. Recent: ${posts.slice(0, 2).map((p) => `"${p.title}"`).join('; ')}.`);

  // Footer on every page: machine-readable copies for agents, and paging.
  pages.forEach((p, i) => {
    const note = sanitize(`Machine-readable: palash.dev/resume.json (JSON Resume attached to this PDF)  ·  palash.dev/resume.llm.txt  ·  Updated ${RESUME.updated}`);
    const text = note + (pages.length > 1 ? sanitize(`  ·  ${i + 1}/${pages.length}`) : '');
    const x = (PAGE_W - widthOf(text, 7.5)) / 2;
    p.ops.push({ kind: 'text', font: 'R', size: 7.5, x, y: 26, text, gray: 0.45 });
    for (const m of text.matchAll(LINKABLE_RE)) {
      const raw = m[0].replace(/[.,;:!?]+$/, '');
      const x0 = x + widthOf(text.slice(0, m.index ?? 0), 7.5);
      p.links.push({ x0, x1: x0 + widthOf(raw, 7.5), y: 26, size: 7.5, url: `https://${raw}` });
    }
  });

  // Serialize
  const contents = pages.map((p) => p.ops.map((op) =>
    op.kind === 'rule'
      ? `0 G ${op.width} w ${op.x1} ${op.y.toFixed(2)} m ${op.x2} ${op.y.toFixed(2)} l S`
      : `${(op.gray ?? 0).toFixed(2)} g BT /F${op.font} ${op.size} Tf ${op.x.toFixed(2)} ${op.y.toFixed(2)} Td (${escapePdf(op.text)}) Tj ET`,
  ).join('\n') + '\n');

  const objects: string[] = [];
  let next = 3; // 1 catalog, 2 pages
  const pageNums: number[] = [];
  const contentNums: number[] = [];
  const annotNums: number[][] = [];
  for (const p of pages) {
    pageNums.push(next++);
    contentNums.push(next++);
    annotNums.push(p.links.map(() => next++));
  }
  const fontNums: Record<Font, number> = { R: next++, B: next++, I: next++ };
  const infoNum = next++;
  const fileNum = next++;
  const specNum = next++;

  const json = asciiJson(resumeJsonResume());
  const date = `D:${RESUME.updated.replace(/-/g, '')}000000Z`;
  objects[1] =
    `<< /Type /Catalog /Pages 2 0 R /Lang (en-US) /ViewerPreferences << /DisplayDocTitle true >> ` +
    `/Names << /EmbeddedFiles << /Names [(resume.json) ${specNum} 0 R] >> >> /AF [${specNum} 0 R] >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  pages.forEach((p, i) => {
    objects[pageNums[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /FR ${fontNums.R} 0 R /FB ${fontNums.B} 0 R /FI ${fontNums.I} 0 R >> >> ` +
      `/Contents ${contentNums[i]} 0 R` +
      (annotNums[i].length ? ` /Annots [${annotNums[i].map((n) => `${n} 0 R`).join(' ')}]` : '') + ' >>';
    p.links.forEach((link, j) => {
      objects[annotNums[i][j]] =
        `<< /Type /Annot /Subtype /Link /Rect [${link.x0.toFixed(1)} ${(link.y - link.size * 0.25).toFixed(1)} ${link.x1.toFixed(1)} ${(link.y + link.size * 0.8).toFixed(1)}] ` +
        `/Border [0 0 0] /A << /S /URI /URI (${escapePdf(link.url)}) >> >>`;
    });
  });
  contents.forEach((body, i) => { objects[contentNums[i]] = `<< /Length ${body.length} >>\nstream\n${body}endstream`; });
  const base: Record<Font, string> = { R: 'Times-Roman', B: 'Times-Bold', I: 'Times-Italic' };
  for (const f of ['R', 'B', 'I'] as Font[]) {
    objects[fontNums[f]] = `<< /Type /Font /Subtype /Type1 /BaseFont /${base[f]} /Encoding /WinAnsiEncoding >>`;
  }
  const skills = RESUME.skills.flatMap((s) => s.value.split(/,\s*/)).slice(0, 30).join(', ');
  objects[infoNum] =
    `<< /Title (${escapePdf(sanitize(`${RESUME.name} - Resume`))}) /Author (${escapePdf(RESUME.name)}) ` +
    `/Subject (${escapePdf(sanitize(`${RESUME.title}. Open to: ${RESUME.openTo.join('; ')}`))}) ` +
    `/Keywords (${escapePdf(sanitize(skills))}) /Creator (palash.dev) /Producer (palash.dev resume generator) ` +
    `/CreationDate (${date}) /ModDate (${date}) >>`;
  objects[fileNum] = `<< /Type /EmbeddedFile /Subtype /application#2Fjson /Length ${json.length} /Params << /ModDate (${date}) >> >>\nstream\n${json}\nendstream`;
  objects[specNum] =
    `<< /Type /Filespec /F (resume.json) /UF (resume.json) /AFRelationship /Data ` +
    `/Desc (Structured copy of this resume in JSON Resume format) /EF << /F ${fileNum} 0 R >> >>`;

  let pdf = '%PDF-1.7\n% palash.dev resume\n';
  const offsets: number[] = [0];
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
