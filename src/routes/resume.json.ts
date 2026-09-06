import type { APIHandler } from 'filesystem-routing/api';
import { RESUME, resumeContactParts, resumeLocationLine, resumeProjects, resumeTotalStars } from '../lib/resume';

/**
 * Structured resume for agents: the same facts as /resume.llm.txt as JSON.
 * Stable keys — safe to parse without an LLM.
 */
export const GET: APIHandler = () => {
  const body = JSON.stringify(
    {
      name: RESUME.name,
      aka: RESUME.aka,
      title: RESUME.title,
      location: resumeLocationLine(),
      email: RESUME.email,
      ...(RESUME.phone ? { phone: RESUME.phone } : {}),
      ...(RESUME.yearsOfExperience ? { yearsOfExperience: RESUME.yearsOfExperience } : {}),
      timezone: RESUME.timezone,
      ...(RESUME.workAuthorization ? { workAuthorization: RESUME.workAuthorization } : {}),
      openTo: RESUME.openTo,
      contacts: resumeContactParts(),
      site: `${RESUME.site}/`,
      github: RESUME.github,
      x: RESUME.x,
      summary: RESUME.summary,
      skills: RESUME.skills,
      experience: RESUME.experience,
      projects: resumeProjects(),
      education: RESUME.education,
      links: {
        resumeHtml: `${RESUME.site}/resume/`,
        resumePdf: `${RESUME.site}/resume.pdf`,
        resumeTxt: `${RESUME.site}/resume.txt`,
        resumeLlm: `${RESUME.site}/resume.llm.txt`,
        resumeJson: `${RESUME.site}/resume.json`,
      },
      portfolioStars: resumeTotalStars(),
      updated: RESUME.updated,
    },
    null,
    2,
  );
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
