import { createEffect } from 'solid-js';

/**
 * One-shot client-side DOM setup after hydration. onSettled would be the
 * canonical 2.0 primitive, but registering it during SSR leaves the server
 * graph unsettled, which silently skips @solidjs/meta's head fill — the
 * whole page loses <title>/<meta>. Effects never run on the server, so the
 * split-effect form is the safe carrier. Returns nothing; cleanup is tied
 * to the element's lifetime.
 */
export const onClientMount = (fn: () => void | (() => void)) => {
  createEffect(
    () => undefined,
    () => fn(),
  );
};
