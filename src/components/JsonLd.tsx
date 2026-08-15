import { Script } from '@solidjs/meta';

/**
 * A schema.org JSON-LD block, hoisted into <head> by @solidjs/meta.
 *
 * Two hard-won constraints meet here: a raw <script> element inside the
 * hydrated subtree desyncs the client's claim walk (route content goes
 * inert), and wrapping it in <NoHydration> kills the meta system's head
 * hoisting for the whole page. The meta-managed <Script> avoids both —
 * it never enters the body's claim sequence at all.
 */
export default function JsonLd(props: { data: object }) {
  return <Script type="application/ld+json">{JSON.stringify(props.data)}</Script>;
}
