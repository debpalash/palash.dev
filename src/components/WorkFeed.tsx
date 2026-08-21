import { For } from 'solid-js';
import FeedItem from './FeedItem';
import type { GalleryShot, Product } from '../lib/content';

/** Prefer a still for feed previews, but fall back to the animated demo
    rather than shipping a card with no media at all (memXT only has a gif). */
const shotFor = (gallery: GalleryShot[], id: string) =>
  gallery.find((item) => item.group === id && !/\.gif(?:$|\?)/i.test(item.src))
    ?? gallery.find((item) => item.group === id);

export default function WorkFeed(props: { products: Product[]; gallery: GalleryShot[] }) {
  return (
    <div class="feed-list feed-grid">
      <For each={props.products}>
        {(p) => {
          const shot = shotFor(props.gallery, p.id);
          return (
            <FeedItem
              href={`/${p.id}`}
              title={p.name}
              meta={`/${p.id}`}
              icon={p.icon}
              logoUrl={p.logoUrl}
              image={p.workImage ?? shot?.src}
              imageAlt={p.workImage ? `${p.name} launchpad` : shot?.title}
              website={p.website}
              github={p.github ?? p.url}
              downloadUrl={p.github ? `${p.github.replace(/\/$/, '')}/releases` : undefined}
              stars={p.stars}
              downloads={p.downloads}
              license={p.license}
              pricing={p.pricing}
              openSource={p.openSource}
              status={p.status}
              theme={p.theme}
            >
              {p.tagline}
            </FeedItem>
          );
        }}
      </For>
    </div>
  );
}
