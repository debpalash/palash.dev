import type { APIHandler } from 'filesystem-routing/api';
import { buildResumePdf } from '../lib/resume-pdf';
import { RESUME } from '../lib/resume';

export const GET: APIHandler = () => {
  const pdf = buildResumePdf();
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Palash-Debnath-resume.pdf"',
      Link:
        `<${RESUME.site}/resume/>; rel="canonical", ` +
        `<${RESUME.site}/resume.txt>; rel="alternate"; type="text/plain", ` +
        `<${RESUME.site}/resume.llm.txt>; rel="alternate"; type="text/markdown", ` +
        `<${RESUME.site}/resume.json>; rel="alternate"; type="application/json"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
