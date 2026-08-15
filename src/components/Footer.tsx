import { SITE } from '../site.config';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer class="footer">
      <div class="shell footer-inner">
        <nav class="footer-links" aria-label="Footer">
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <a href={SITE.github} target="_blank" rel="noopener">github</a>
          <a href={SITE.x} target="_blank" rel="noopener">x</a>
          <a href={SITE.voicestudio} target="_blank" rel="noopener">voicestudio</a>
          <a href={SITE.company.url} target="_blank" rel="noopener">
            {SITE.company.name.toLowerCase()}
          </a>
          {/* rel="external": real resource, not a router page — skip the client router */}
          <a href="/rss.xml" rel="external">rss</a>
        </nav>
        <p class="footer-note">© {year} {SITE.author}</p>
      </div>
    </footer>
  );
}
