import { Show } from 'solid-js';
import type { ParentProps } from 'solid-js';
import PageShell from './PageShell';
import ProfileHeader from './ProfileHeader';
import TabBar, { type TabKey } from './TabBar';

interface ProfileShellProps extends ParentProps {
  title: string;
  description?: string;
  ogImage?: string;
  active: TabKey;
  /** canonical pathname with trailing slash */
  path: string;
  pageHeading?: string;
  sectionHeading?: string;
  sectionDescription?: string;
  schemaType?: string | string[];
  mainEntityId?: string;
  breadcrumbId?: string;
}

/**
 * The profile shell shared by /, /blog, /lab and /media — the Solid port of
 * layouts/Profile.astro. Profile header, tabs, and feed in one column.
 */
export default function ProfileShell(props: ProfileShellProps) {
  return (
    <PageShell
      title={props.title}
      description={props.description}
      ogImage={props.ogImage}
      path={props.path}
      schemaType={props.schemaType}
      mainEntityId={props.mainEntityId}
      breadcrumbId={props.breadcrumbId}
      wide
    >
      <div class="profile-main">
        {/* One identical header on every tab — switching tabs must not reflow it. */}
        <ProfileHeader showH1={!props.pageHeading} />
        <TabBar active={props.active} />
        <Show when={props.pageHeading || props.sectionHeading}>
          <header class="feed-intro">
            <p class="feed-intro-kicker mono">
              {props.active === 'work' ? 'Selected work' : props.active}
            </p>
            <Show when={props.pageHeading} fallback={<h2>{props.sectionHeading}</h2>}>
              <h1>{props.pageHeading}</h1>
            </Show>
            <Show when={props.sectionDescription}>
              <p>{props.sectionDescription}</p>
            </Show>
          </header>
        </Show>
        <div class="feed">{props.children}</div>
      </div>
    </PageShell>
  );
}
