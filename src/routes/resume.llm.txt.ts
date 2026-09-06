import type { APIHandler } from 'filesystem-routing/api';
import { RESUME, renderResumeLlm } from '../lib/resume';

export const GET: APIHandler = () => {
  const body = renderResumeLlm();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'inline; filename="resume.llm.txt"',
      Link:
        `<${RESUME.site}/resume/>; rel="canonical", ` +
        `<${RESUME.site}/resume.pdf>; rel="alternate"; type="application/pdf", ` +
        `<${RESUME.site}/resume.txt>; rel="alternate"; type="text/plain", ` +
        `<${RESUME.site}/resume.json>; rel="alternate"; type="application/json"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
