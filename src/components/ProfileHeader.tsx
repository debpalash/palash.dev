import { For, Show } from 'solid-js';
import { SITE } from '../site.config';
import { experiments, posts, products, totalStars } from '../lib/content';

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
const formatCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

const supportLink =
  SITE.links.find(({ label }) => label === 'ko-fi')?.href ?? 'https://ko-fi.com/debpalash';
const paypalLink =
  SITE.links.find(({ label }) => label === 'paypal')?.href ?? 'https://paypal.me/palashCoder';

const counts = [
  { href: '/', n: `${products.length}`, label: 'shipped', external: false },
  { href: '/blog', n: `${posts.length}`, label: plural(posts.length, 'post'), external: false },
  { href: '/lab', n: `${experiments.length}`, label: plural(experiments.length, 'experiment'), external: false },
  { href: SITE.github, n: formatCompact(totalStars), label: 'stars', external: true },
];

export default function ProfileHeader(props: { showH1?: boolean }) {
  const showH1 = () => props.showH1 ?? true;
  return (
    <header class="phead">
      <a class="phead-banner" href="/omnivoice">
        <img
          src="/projects/omnivoice-signal-field-1200.webp"
          alt=""
          width="1200"
          height="675"
          fetchpriority="high"
        />
        <span class="phead-banner-caption">
          <span class="phead-banner-kicker mono">Current focus</span>
          <strong>VoiceStudio.sh</strong>
          <span>Open-Source AI Voice Studio <span aria-hidden="true">↗</span></span>
        </span>
      </a>

      <div class="phead-top">
        <div class="phead-person">
          <img
            class="phead-avatar"
            src="/avatar.webp"
            alt={SITE.author}
            width="256"
            height="256"
            fetchpriority="high"
          />
          <div class="phead-identity">
            <Show when={showH1()} fallback={<p class="phead-name">{SITE.author}</p>}>
              <h1 class="phead-name">{SITE.author}</h1>
            </Show>
            <p class="phead-handle mono">@{SITE.handle}</p>
            <p class="phead-role mono">Software engineer · product builder</p>
          </div>
        </div>

        <div class="phead-actions">
          <a class="phead-rss" href="/rss.xml" rel="external">
            <svg class="phead-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 19h.01M5 14a5 5 0 0 1 5 5M5 9a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.7" />
            </svg>
            RSS
          </a>
          <a class="phead-email" href={`mailto:${SITE.email}`} aria-label={`Email ${SITE.author}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3.5 5.5h17v13h-17zM4 6l8 6 8-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
            </svg>
          </a>
          <a class="phead-icon" href={SITE.github} target="_blank" rel="noopener" aria-label="Follow on GitHub" title="GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
            </svg>
          </a>
          <a class="phead-icon" href={SITE.x} target="_blank" rel="noopener" aria-label="Follow on X" title="X">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 4h4.6l4.1 5.9L17.8 4H20l-6.3 7.3L20.4 20h-4.6l-4.4-6.3L6.2 20H4l6.7-7.7Z" fill="currentColor" />
            </svg>
          </a>
          <a class="phead-icon" href={supportLink} target="_blank" rel="noopener" aria-label="Support on Ko-fi" title="Ko-fi">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3.5 8h12v6.5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4Zm12 1.2h1.9a2.65 2.65 0 1 1 0 5.3h-1.9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
              <path d="M9.5 10.9c-.66-.7-1.8-.47-2.08.38-.19.6.09 1.22.66 1.74l1.42 1.28 1.42-1.28c.57-.52.85-1.13.66-1.74-.28-.85-1.42-1.09-2.08-.38Z" fill="currentColor" />
            </svg>
          </a>
          <a class="phead-icon" href={paypalLink} target="_blank" rel="noopener" aria-label="Support via PayPal" title="PayPal">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8.6 19.5 11 5h4.1a4 4 0 0 1 0 8H10M7 21.5l.5-2.9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
            </svg>
          </a>
        </div>
      </div>

      <p class="phead-bio">
        Independent engineer behind <a href="/omnivoice">VoiceStudio.sh</a>, <a href="/opal">Opal</a>,
        and <a href="/memxt">memXT</a>. Obsessed with AI voice, local-first media, and agent
        memory — and <a href="/blog">writing</a> about what building them teaches me.
      </p>

      <p class="phead-meta mono">
        <span>
          <svg class="pmeta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M19 10.2c0 5.1-7 10.3-7 10.3S5 15.3 5 10.2a7 7 0 1 1 14 0Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6" />
            <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6" />
          </svg>
          Agartala, India
        </span>
        <a href={SITE.github} target="_blank" rel="noopener">
          <svg class="pmeta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m9.2 14.8 5.6-5.6M8 18H6.5a4.5 4.5 0 0 1 0-9H10M16 6h1.5a4.5 4.5 0 0 1 0 9H14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
          </svg>
          github.com/{SITE.handle}
        </a>
        <a href={SITE.x} target="_blank" rel="noopener">
          <svg class="pmeta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 4h4.6l4.1 5.9L17.8 4H20l-6.3 7.3L20.4 20h-4.6l-4.4-6.3L6.2 20H4l6.7-7.7Z" fill="currentColor" />
          </svg>
          x.com/{SITE.xHandle}
        </a>
        <span>
          <svg class="pmeta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m8 6-5 6 5 6M16 6l5 6-5 6M14 4l-4 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
          </svg>
          {SITE.stack.slice(0, 3).join(' · ')}
        </span>
      </p>

      <p class="phead-counts">
        <For each={counts}>
          {(c) => (
            <a
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener' : undefined}
              title={c.external ? `${totalStars.toLocaleString()} total GitHub stars` : undefined}
            >
              <strong>{c.n}</strong> {c.label}
            </a>
          )}
        </For>
      </p>
    </header>
  );
}
