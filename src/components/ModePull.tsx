import { onClientMount } from '../lib/mount';

/**
 * The light/dark cord pull. Markup renders on the server; the behavior
 * attaches once the client render settles (onSettled is 2.0's onMount).
 */
export default function ModePull() {
  let pull: HTMLDivElement | undefined;
  let knob: HTMLButtonElement | undefined;

  onClientMount(() => {
    const pullEl = pull;
    const knobEl = knob;
    if (!pullEl || !knobEl || pullEl.dataset.ready === 'true') return;
    pullEl.dataset.ready = 'true';

    try {
      const saved = localStorage.getItem('palash-mode');
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.dataset.mode = saved;
      }
    } catch { /* storage can be disabled */ }

    const setMode = (mode: 'dark' | 'light', animate = false) => {
      const apply = () => {
        document.documentElement.dataset.mode = mode === 'light' ? 'light' : 'dark';
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
          'content',
          mode === 'light' ? '#f2efe8' : '#080a0d',
        );
        knobEl.setAttribute('aria-pressed', String(mode === 'light'));
        knobEl.setAttribute('aria-label', mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        try { localStorage.setItem('palash-mode', mode); } catch { /* storage can be disabled */ }
      };

      if (animate && 'startViewTransition' in document) {
        const root = document.documentElement;
        root.classList.add('mode-changing');
        const transition = (document as Document & {
          startViewTransition?: (callback: () => void) => { finished: Promise<unknown> };
        }).startViewTransition?.(apply);
        transition?.finished.finally(() => root.classList.remove('mode-changing'));
      } else {
        apply();
      }
    };

    let saved: string | null = null;
    try { saved = localStorage.getItem('palash-mode'); } catch { /* storage can be disabled */ }
    const current = saved === 'light' || saved === 'dark'
      ? saved
      : document.documentElement.dataset.mode === 'light' ? 'light' : 'dark';
    setMode(current);

    const onClick = () => {
      pullEl.classList.remove('is-pulling');
      void pullEl.offsetWidth;
      pullEl.classList.add('is-pulling');
      setMode(document.documentElement.dataset.mode === 'light' ? 'dark' : 'light', true);
      window.setTimeout(() => pullEl.classList.remove('is-pulling'), 520);
    };
    knobEl.addEventListener('click', onClick);
    return () => knobEl.removeEventListener('click', onClick);
  });

  return (
    <div class="mode-pull" data-mode-pull ref={(el) => (pull = el)}>
      <span class="mode-pull-cord" aria-hidden="true"></span>
      <button
        class="mode-pull-knob"
        type="button"
        aria-label="Switch to light mode"
        aria-pressed="false"
        ref={(el) => (knob = el)}
      >
        <span class="mode-pull-sun" aria-hidden="true">☼</span>
        <span class="mode-pull-moon" aria-hidden="true">◐</span>
      </button>
    </div>
  );
}
