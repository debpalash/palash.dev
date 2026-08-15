import { For } from 'solid-js';
import { onClientMount } from '../lib/mount';
import { SITE } from '../site.config';

export type TabKey = 'work' | 'writing' | 'lab' | 'media' | 'contact';

const tabs = [
  { key: 'work', href: '/', label: 'Work' },
  { key: 'writing', href: '/blog', label: 'Writing' },
  { key: 'lab', href: '/lab', label: 'Experiments' },
  { key: 'media', href: '/media', label: 'Media' },
  { key: 'contact', href: '/contact', label: 'Contact' },
] as const;

/**
 * The profile tabs. Each is a real route — plain navigation the client
 * router upgrades to soft transitions. Once the bar sticks (the sentinel
 * above it scrolls out), it reveals a mini identity — avatar, name,
 * handle — so the page keeps a face while the header is gone.
 */
export default function TabBar(props: { active: TabKey }) {
  let sentinel: HTMLDivElement | undefined;
  let bar: HTMLElement | undefined;

  onClientMount(() => {
    if (!sentinel || !bar) return;
    const barEl = bar;
    const observer = new IntersectionObserver(
      ([entry]) => barEl.classList.toggle('is-stuck', !entry.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  return (
    <>
      <div class="ptabs-sentinel" aria-hidden="true" ref={(el) => (sentinel = el)}></div>
      <nav class="ptabs" aria-label="Profile sections" ref={(el) => (bar = el)}>
        <a class="ptabs-id" href="/" aria-label={`${SITE.author} — home`} tabindex="-1">
          <img src="/avatar.webp" alt="" width="30" height="30" loading="lazy" />
          <span class="ptabs-id-text">
            <strong>{SITE.author}</strong>
            <small class="mono">@{SITE.handle}</small>
          </span>
        </a>
        <For each={tabs}>
          {(t) => (
            <a
              href={t.href}
              class={['ptab', { 'is-active': t.key === props.active }]}
              aria-current={t.key === props.active ? 'page' : undefined}
            >
              <span class="ptab-label">{t.label}</span>
            </a>
          )}
        </For>
      </nav>
    </>
  );
}
