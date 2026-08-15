/**
 * PhotoSwipe wiring shared by the media grid and the product gallery strip.
 * Loaded lazily on hydration; the modules never enter the critical path.
 */
export async function initPhotoSwipe(gallery: HTMLElement) {
  if (gallery.dataset.pswpInitialized === 'true') return;
  const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox');
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: 'a[data-pswp-item]',
    pswpModule: () => import('photoswipe'),
  });
  lightbox.on('uiRegister', () => {
    lightbox.pswp?.ui?.registerElement({
      name: 'caption',
      className: 'pswp__caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (element, pswp) => {
        pswp.on('change', () => {
          element.textContent =
            (pswp.currSlide?.data.element as HTMLElement | undefined)?.dataset.pswpCaption ?? '';
        });
      },
    });
  });
  lightbox.init();
  gallery.dataset.pswpInitialized = 'true';
}
