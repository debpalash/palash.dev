import { For, onSettled } from 'solid-js';
import type { GalleryShot } from '../lib/content';
import { initPhotoSwipe } from '../lib/lightbox';

export default function GalleryStrip(props: {
  items: GalleryShot[];
  /** link each shot to the product page for its group instead of the raw image */
  linkToProduct?: boolean;
}) {
  let strip: HTMLDivElement | undefined;
  onSettled(() => {
    if (strip && !props.linkToProduct) void initPhotoSwipe(strip);
  });

  return (
    <div class="gallery-strip" data-pswp-gallery ref={(el) => (strip = el)}>
      <For each={props.items}>
        {(item) => (
          <a
            class="shot"
            href={props.linkToProduct ? `/${item.group}` : item.src}
            target={props.linkToProduct ? undefined : '_blank'}
            rel={props.linkToProduct ? undefined : 'noopener'}
            aria-label={item.title}
            data-pswp-item={!props.linkToProduct ? true : undefined}
            data-pswp-width={!props.linkToProduct ? 1600 : undefined}
            data-pswp-height={!props.linkToProduct ? 1000 : undefined}
            data-pswp-caption={!props.linkToProduct ? item.caption : undefined}
          >
            <img
              src={`/gallery/${item.id}.webp`}
              alt={item.title}
              width="600"
              height="375"
              loading="lazy"
              decoding="async"
            />
            <span class="shot-cap">{item.caption}</span>
          </a>
        )}
      </For>
    </div>
  );
}
