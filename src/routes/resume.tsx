import { For, Show } from 'solid-js';
import { createSignal } from 'solid-js';
import { Link } from '@solidjs/meta';
import PageShell from '../components/PageShell';
import JsonLd from '../components/JsonLd';
import { RESUME, renderResumeLlm, resumeLocationLine, resumeProjects } from '../lib/resume';
import { onClientMount } from '../lib/mount';
import { SITE } from '../site.config';

const resumeUrl = `${SITE.url}/resume/`;
const personId = `${SITE.url}/#person`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      name: RESUME.name,
      jobTitle: RESUME.title,
      url: SITE.url,
      email: `mailto:${RESUME.email}`,
      sameAs: [SITE.github, SITE.x],
      knowsAbout: SITE.stack,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${resumeUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.author, item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Resume', item: resumeUrl },
      ],
    },
  ],
};

const projects = resumeProjects();
/** Agent source, rendered into the page so crawlers and no-JS agents get it. */
const agentMarkdown = renderResumeLlm();

type View = 'agent' | 'human';
const STORAGE_KEY = 'palash-resume-view';

function HumanResume() {
  return (
    <article>
      <header class="product-head">
        <div>
          <h1>{RESUME.name}</h1>
          <p class="article-desc">{RESUME.title}</p>
          <div class="article-meta">
            <span>{resumeLocationLine()}</span>
          </div>
          <Show when={RESUME.openTo.length > 0}>
            <div class="article-meta">
              <span>Open to: {RESUME.openTo.join(' · ')}</span>
            </div>
          </Show>
          <nav class="product-links" aria-label="Resume downloads">
            <a href="/resume.pdf">resume.pdf ↓</a>
            <a href="/resume.txt">resume.txt ↓</a>
            <a href="/resume.llm.txt">resume.llm.txt ↓</a>
          </nav>
        </div>
      </header>

      <section class="product-section">
        <h2>Summary</h2>
        <p>{RESUME.summary}</p>
        <p class="article-meta">
          <a href={`mailto:${RESUME.email}`}>{RESUME.email}</a>
          <Show when={RESUME.phone}>
            {' · '}
            <a href={`tel:${RESUME.phone.replace(/\s+/g, '')}`}>{RESUME.phone}</a>
          </Show>
          {' · '}
          <a href={RESUME.github} target="_blank" rel="noopener">
            {RESUME.githubHandle}
          </a>
          {' · '}
          <a href={RESUME.site}>{RESUME.site.replace('https://', '')}</a>
        </p>
        <Show when={RESUME.yearsOfExperience}>
          <p class="article-meta">
            <span>Experience: {RESUME.yearsOfExperience}</span>
          </p>
        </Show>
      </section>

      <section class="product-section">
        <h2>Skills</h2>
        <ul>
          <For each={RESUME.skills}>
            {(s) => (
              <li>
                <strong>{s.label}:</strong> {s.value}
              </li>
            )}
          </For>
        </ul>
      </section>

      <section class="product-section">
        <h2>Experience</h2>
        <For each={RESUME.experience}>
          {(e) => (
            <div>
              <h3>
                {e.role} — {e.org} ({e.period})
              </h3>
              <ul>
                <For each={e.bullets}>{(b) => <li>{b}</li>}</For>
              </ul>
            </div>
          )}
        </For>
      </section>

      <section class="product-section">
        <h2>Selected open-source work</h2>
        <For each={projects}>
          {(p) => (
            <div>
              <h3>{p.name}</h3>
              <p>
                <em>{p.tagline}</em>
              </p>
              <ul>
                <For each={p.bullets}>{(b) => <li>{b}</li>}</For>
              </ul>
            </div>
          )}
        </For>
      </section>

      <section class="product-section">
        <h2>Writing</h2>
        <p>
          <a href="/blog/">The Log</a> — engineering and product notes: shipping fast,
          building with AI, sovereign/local-first AI, agent memory, voice tech.
        </p>
      </section>

      <Show when={RESUME.education.length > 0}>
        <section class="product-section">
          <h2>Education</h2>
          <ul>
            <For each={RESUME.education}>
              {(e) => (
                <li>
                  <strong>{e.school}</strong> ({e.detail})
                </li>
              )}
            </For>
          </ul>
        </section>
      </Show>
    </article>
  );
}

export default function Resume() {
  // Agent-first: SSR and no-JS clients see the machine-readable source.
  // Humans flip to the rendered view; the choice persists client-side.
  const [view, setView] = createSignal<View>('agent');
  const [copied, setCopied] = createSignal(false);

  onClientMount(() => {
    const param = new URLSearchParams(location.search).get('view');
    if (param === 'human' || param === 'agent') {
      setView(param);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'human' || stored === 'agent') setView(stored);
    } catch {
      /* private mode — stay on the default */
    }
  });

  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const url = new URL(location.href);
    url.searchParams.set('view', next);
    history.replaceState(null, '', url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(agentMarkdown);
    } catch {
      const area = document.createElement('textarea');
      area.value = agentMarkdown;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageShell
      title="Resume — Palash Debnath, Software Engineer"
      description="ATS-friendly resume of Palash Debnath: machine-readable agent source plus the human rendering, with PDF, TXT, JSON, and LLM-markdown downloads."
      path="/resume/"
      mainEntityId={personId}
      breadcrumbId={`${resumeUrl}#breadcrumb`}
      narrow
    >
      <JsonLd data={jsonLd} />
      <Link rel="alternate" type="text/markdown" title="Resume (LLM markdown)" href="/resume.llm.txt" />
      <Link rel="alternate" type="text/plain" title="Resume (plain text)" href="/resume.txt" />
      <Link rel="alternate" type="application/json" title="Resume (JSON)" href="/resume.json" />
      <Link rel="alternate" type="application/pdf" title="Resume (PDF)" href="/resume.pdf" />

      <p class="back-link mono">
        <a href="/" class="muted">← palash.dev</a>
      </p>

      <div class="view-toggle" role="group" aria-label="Resume view">
        <button type="button" aria-pressed={view() === 'agent' ? 'true' : 'false'} onClick={() => choose('agent')}>
          Agent
        </button>
        <button type="button" aria-pressed={view() === 'human' ? 'true' : 'false'} onClick={() => choose('human')}>
          Human
        </button>
      </div>

      <p class="resume-updated mono">Updated {RESUME.updated} · facts mirror palash.dev + GitHub</p>

      <Show when={view() === 'agent'}>
        <div class="resume-agent">
          <div class="resume-agent-head">
            <p class="article-desc">
              Machine-readable resume — same facts as the human page, Markdown. Fetch{' '}
              <a href="/resume.llm.txt">resume.llm.txt</a> or <a href="/resume.json">resume.json</a> raw.
            </p>
            <button type="button" class="resume-copy" onClick={copy}>
              {copied() ? 'Copied ✓' : 'Copy markdown'}
            </button>
          </div>
          <div class="prose">
            <pre>
              <code>{agentMarkdown}</code>
            </pre>
          </div>
          <nav class="product-links" aria-label="Resume downloads">
            <a href="/resume.llm.txt">resume.llm.txt ↓</a>
            <a href="/resume.json">resume.json ↓</a>
            <a href="/resume.txt">resume.txt ↓</a>
            <a href="/resume.pdf">resume.pdf ↓</a>
          </nav>
        </div>
      </Show>

      <Show when={view() === 'human'}>
        <HumanResume />
      </Show>
    </PageShell>
  );
}
