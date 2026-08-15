import { Show } from 'solid-js';
import type { ParentProps } from 'solid-js';

interface FeedItemProps extends ParentProps {
  href: string;
  title: string;
  meta?: string;
  dateTime?: string;
  external?: boolean;
  icon?: string;
  logoUrl?: string;
  image?: string;
  imageAlt?: string;
  website?: string;
  github?: string;
  downloadUrl?: string;
  stars?: number;
  downloads?: number;
  license?: string;
  pricing?: 'free' | 'paid' | 'freemium';
  openSource?: boolean;
  status?: 'live' | 'beta' | 'coming-soon' | string;
  theme?: string;
  variant?: 'work' | 'writing' | 'lab';
  category?: string;
}

const formatStars = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count);

/**
 * An X-style post: the main card is a link to the detail page, while
 * project metadata lives in a separate action row so links never nest.
 */
export default function FeedItem(props: FeedItemProps) {
  const variant = () => props.variant ?? 'work';
  const icon = () => props.icon ?? '►';
  const statusLabel = () => (props.status === 'coming-soon' ? 'coming soon' : props.status);
  const hasDetails = () =>
    props.website || props.github || props.downloadUrl || props.stars !== undefined ||
    props.license || props.pricing || props.openSource || statusLabel();

  return (
    <article
      class={['fitem', `fitem-${variant()}`, { [`fitem-theme-${props.theme}`]: !!props.theme }]}
    >
      <a
        class="fitem-main"
        href={props.href}
        target={props.external ? '_blank' : undefined}
        rel={props.external ? 'noopener' : undefined}
      >
        <Show when={variant() !== 'writing'}>
          <span class="fitem-avatar" aria-hidden="true">
            <Show when={props.logoUrl} fallback={<span>{icon()}</span>}>
              <img src={props.logoUrl} alt="" width="40" height="40" loading="lazy" />
            </Show>
          </span>
        </Show>

        <span class="fitem-body">
          <Show when={variant() === 'writing' && (props.category || props.meta)}>
            <span class="fitem-kicker mono">
              <Show when={props.meta}><time datetime={props.dateTime}>{props.meta}</time></Show>
              <Show when={props.category}><span>{props.category}</span></Show>
            </span>
          </Show>
          <span class="fitem-head">
            <strong class="fitem-title">{props.title}</strong>
            <Show when={variant() !== 'writing' && props.meta}>
              <span class="fitem-meta mono">{props.meta}</span>
            </Show>
            <Show when={variant() !== 'writing' && props.category}>
              <span class="fitem-category mono">{props.category}</span>
            </Show>
            <Show when={props.external}>
              <span class="fitem-meta" aria-hidden="true">↗</span>
            </Show>
          </span>
          <Show when={props.children}>
            <span class="fitem-desc">{props.children}</span>
          </Show>
          <Show when={props.image}>
            <span class="fitem-media">
              <img src={props.image} alt={props.imageAlt ?? ''} width="1600" height="1000" loading="lazy" decoding="async" />
            </span>
          </Show>
        </span>
      </a>

      <Show when={hasDetails()}>
        <div class="fitem-details">
          <div class="fitem-badges" aria-label="Project details">
            <Show when={statusLabel()}>
              <span class="fitem-badge fitem-badge-status">{statusLabel()}</span>
            </Show>
            <Show when={props.openSource}><span class="fitem-badge">open source</span></Show>
            <Show when={props.pricing}><span class="fitem-badge">{props.pricing}</span></Show>
            <Show when={props.license}><span class="fitem-badge">{props.license}</span></Show>
            <Show when={props.stars !== undefined && props.github}>
              <a class="fitem-badge fitem-badge-link" href={`${props.github}/stargazers`} target="_blank" rel="noopener">
                ★ {formatStars(props.stars!)}
              </a>
            </Show>
            <Show when={props.downloads !== undefined && props.github}>
              <a class="fitem-badge fitem-badge-link" href={`${props.github}/releases`} target="_blank" rel="noopener">
                ⇩ {formatStars(props.downloads!)}
              </a>
            </Show>
          </div>
          <nav class="fitem-links" aria-label={`${props.title} links`}>
            <Show when={props.website}>
              <a href={props.website} target="_blank" rel="noopener">website ↗</a>
            </Show>
            <Show when={props.github}>
              <a href={props.github} target="_blank" rel="noopener">github ↗</a>
            </Show>
            <Show when={props.downloadUrl}>
              <a href={props.downloadUrl} target="_blank" rel="noopener">downloads ↗</a>
            </Show>
          </nav>
        </div>
      </Show>
    </article>
  );
}
