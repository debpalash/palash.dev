import { Errored, Loading } from 'solid-js';
import { Router } from './router';
import ModePull from './components/ModePull';
import Footer from './components/Footer';
import './styles/page.css';
import 'photoswipe/style.css';

// The app root: stable chrome (skip link, mode pull, footer) lives here so
// route transitions only ever swap a single <main> element — each route
// brings its own shell class via PageShell/ProfileShell.
export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <a href="#main" class="skip-link">Skip to content</a>
          <ModePull />
          <Errored
            fallback={(err, reset) => (
              <main id="main" class="shell">
                <div class="shell-measure notfound">
                  <p class="notfound-code" aria-label="Error">:(</p>
                  <h1>Something Broke</h1>
                  <p class="notfound-copy muted">{String(err())}</p>
                  <div class="btn-row">
                    <button class="btn btn-primary" onClick={reset}>Try Again</button>
                    <a class="btn" href="/">Go Home</a>
                  </div>
                </div>
              </main>
            )}
          >
            <Loading fallback={null}>{props.children}</Loading>
          </Errored>
          <Footer />
        </>
      )}
    </Router>
  );
}
