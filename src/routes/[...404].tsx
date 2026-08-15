import type { RouteDefinition } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import NotFound from '../components/NotFound';

// The catch-all route. httpStatus() sets the response status during SSR
// (a no-op in the browser); it runs in preload so the status code is set
// before the response head flushes.
export const route = {
  preload: () => httpStatus(404),
} satisfies RouteDefinition;

export default function NotFoundPage() {
  return <NotFound path="/404/" />;
}
