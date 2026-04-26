import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (current) setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('flux-theme', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--flux-fg-muted)',
        background: 'var(--flux-glass-bg)',
        border: '1px solid var(--flux-glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-1_5) var(--spacing-3)',
        cursor: 'pointer',
        transition: 'all var(--duration-normal) var(--ease-flux)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{theme === 'dark' ? '◐' : '◑'}</span>
      <span>{theme === 'dark' ? 'light' : 'dark'}</span>
    </button>
  );
}
