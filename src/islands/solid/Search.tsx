/** @jsxImportSource solid-js */
import { createMemo, createResource, createSignal, For, onMount, Show, Suspense } from 'solid-js';
import { searchEntries, type SearchEntry } from '../../lib/search';

export default function Search() {
  const [query, setQuery] = createSignal('');
  const [kind, setKind] = createSignal('all');
  const [ready, setReady] = createSignal(false);
  onMount(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') ?? '');
    const filter = params.get('kind');
    if (filter === 'article' || filter === 'project') setKind(filter);
    setReady(true);
  });
  const [entries, { refetch }] = createResource(ready, async () => {
    try {
      const response = await fetch('/search-index.json', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Search index unavailable');
      return { items: await response.json() as SearchEntry[], error: false };
    } catch {
      return { items: [] as SearchEntry[], error: true };
    }
  });
  const results = createMemo(() => searchEntries(entries()?.items ?? [], query(), kind()));
  function syncUrl() {
    const url = new URL(location.href);
    if (query()) url.searchParams.set('q', query()); else url.searchParams.delete('q');
    if (kind() !== 'all') url.searchParams.set('kind', kind()); else url.searchParams.delete('kind');
    history.replaceState(null, '', url);
  }
  return <section aria-label="Search projects and writing">
    <form role="search" onSubmit={e => { e.preventDefault(); syncUrl(); }}>
      <p><label for="query">Search projects and writing</label><br />
        <input id="query" name="q" type="search" value={query()} onInput={e => { setQuery(e.currentTarget.value); syncUrl(); }} />
      </p>
      <p><label for="kind">Show </label><select id="kind" value={kind()} onChange={e => { setKind(e.currentTarget.value); syncUrl(); }}>
        <option value="all">Everything</option><option value="project">Projects</option><option value="article">Articles</option>
      </select></p>
    </form>
      <Suspense fallback={<p role="status">Loading search…</p>}>
        <Show when={!entries()?.error} fallback={<p role="alert">Search could not load. <button disabled={entries.loading} onClick={() => void refetch()}>Retry</button> or <a href="/blog/">browse writing</a>.</p>}>
        <Show when={ready()}>
          <p role="status" aria-live="polite">{results().length} results</p>
          <Show when={results().length} fallback={<p>No matches. Try another term.</p>}>
            <ul class="list results"><For each={results()}>{entry => <li><a href={entry.url}>{entry.title}</a><p>{entry.description}</p></li>}</For></ul>
          </Show>
        </Show>
        </Show>
      </Suspense>
  </section>;
}
