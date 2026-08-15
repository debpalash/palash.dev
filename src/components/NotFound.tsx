import PageShell from './PageShell';

/**
 * The 404 page body — used by the catch-all route and by the dynamic
 * slug routes when nothing matches.
 */
export default function NotFound(props: { path: string }) {
  return (
    <PageShell title="404 — Page Not Found" description="That page doesn't exist." path={props.path} noIndex>
      <div class="notfound">
        <p class="notfound-code" aria-label="404">404</p>
        <h1>Page Not Found</h1>
        <p class="notfound-copy muted">
          This one was deleted, moved, or never shipped.
        </p>

        <div class="btn-row">
          <a class="btn btn-primary" href="/">Go Home</a>
          <a class="btn" href="/blog">Read the Log</a>
        </div>
      </div>
    </PageShell>
  );
}
