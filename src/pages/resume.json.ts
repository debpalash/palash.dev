import type { APIRoute } from 'astro';
import { RESUME, resumeData } from '../lib/resume';

/**
 * Structured resume for agents: the same facts as /resume.llm.txt as JSON.
 * Stable keys — safe to parse without an LLM.
 */
export const GET: APIRoute = () => {
  const body = JSON.stringify(resumeData(), null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'inline; filename="resume.json"',
      Link:
        `<${RESUME.site}/resume/>; rel="canonical", ` +
        `<${RESUME.site}/resume.pdf>; rel="alternate"; type="application/pdf", ` +
        `<${RESUME.site}/resume.txt>; rel="alternate"; type="text/plain", ` +
        `<${RESUME.site}/resume.llm.txt>; rel="alternate"; type="text/markdown"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
