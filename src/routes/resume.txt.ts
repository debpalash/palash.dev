import type { APIHandler } from 'filesystem-routing/api';
import { RESUME, renderResumeTxt } from '../lib/resume';

export const GET: APIHandler = () => {
  const body = renderResumeTxt();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'inline; filename="Palash-Debnath-resume.txt"',
      // Agents landing on one format discover the rest without scraping HTML.
      Link:
        `<${RESUME.site}/resume/>; rel="canonical", ` +
        `<${RESUME.site}/resume.pdf>; rel="alternate"; type="application/pdf", ` +
        `<${RESUME.site}/resume.llm.txt>; rel="alternate"; type="text/markdown", ` +
        `<${RESUME.site}/resume.json>; rel="alternate"; type="application/json"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
