import { For } from 'solid-js';
import { onClientMount } from '../lib/mount';
import type { GalleryShot } from '../lib/content';
import { initPhotoSwipe } from '../lib/lightbox';

export default function MediaGrid(props: { items: GalleryShot[] }) {
  let grid: HTMLDivElement | undefined;
  onClientMount(() => {
    if (grid) void initPhotoSwipe(grid);
  });

  return (
    <div class="mgrid" data-pswp-gallery ref={(el) => (grid = el)}>
      <For each={props.items}>
        {(item) => (
          <figure class="mtile">
            <a
              class="mtile-image"
              href={item.src}
              target="_blank"
              rel="noopener"
              aria-label={`Open ${item.title}`}
              data-pswp-item
              data-pswp-width="1600"
              data-pswp-height="1000"
              data-pswp-caption={item.caption}
            >
              <img
                src={`/gallery/${item.id}.webp`}
                alt={item.title}
                width="600"
                height="375"
                loading="lazy"
                decoding="async"
              />
            </a>
            <figcaption class="mtile-caption">
              <span>{item.caption}</span>
              <a href={`/${item.group}`}>view project ↗</a>
            </figcaption>
          </figure>
        )}
      </For>
    </div>
  );
}
