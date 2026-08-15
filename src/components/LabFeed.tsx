import { For } from 'solid-js';
import FeedItem from './FeedItem';
import type { Experiment } from '../lib/content';

export default function LabFeed(props: { items: Experiment[] }) {
  return (
    <div class="feed-list">
      <For each={props.items}>
        {(x) => (
          <FeedItem href={x.url} title={x.name} meta={x.lang} icon="◇" external>
            {x.description}
          </FeedItem>
        )}
      </For>
    </div>
  );
}
