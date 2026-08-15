import { NoHydration } from 'solid-js';

/**
 * A schema.org JSON-LD block. Crawlers accept ld+json anywhere in the
 * document, and crawlers only ever see the server render.
 *
 * NoHydration is load-bearing: a raw <script> element inside a hydrated
 * subtree desyncs the client's claim walk — the route content stays inert
 * and interactive children (PhotoSwipe, …) bind to a detached tree. Marking
 * the script server-only keeps it out of the claim sequence.
 */
export default function JsonLd(props: { data: object }) {
  return (
    <NoHydration>
      <script type="application/ld+json" innerHTML={JSON.stringify(props.data)} />
    </NoHydration>
  );
}
