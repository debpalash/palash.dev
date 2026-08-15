import { For } from 'solid-js';
import FeedItem from './FeedItem';
import type { Post } from '../lib/content';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });
const relativeDate = (date: Date) => {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
};

export default function WritingFeed(props: { posts: Post[] }) {
  return (
    <div class="feed-list">
      <For each={props.posts}>
        {(post) => (
          <FeedItem
            href={`/blog/${post.id}`}
            title={post.title}
            meta={relativeDate(post.publishDate)}
            dateTime={post.publishDate.toISOString()}
            variant="writing"
            category={post.tags.join(' · ') || 'field notes'}
          />
        )}
      </For>
    </div>
  );
}
