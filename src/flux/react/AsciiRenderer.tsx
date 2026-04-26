import { useState, useEffect } from 'react';

const PATTERNS = [
  '∴ ∵ ⊕ ⊗ △ ◇ ∴ ∵ ⊕ ⊗',
  '⊕ △ ◇ ∴ ∵ ⊗ △ ◇ ∴ ∵',
  '◇ ∴ ⊗ △ ∵ ⊕ ◇ ∴ ⊗ △',
  '△ ⊕ ∵ ◇ ⊗ ∴ △ ⊕ ∵ ◇',
];

interface Props {
  speed?: number;
}

export default function AsciiRenderer({ speed = 2000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % PATTERNS.length);
    }, speed);
    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--flux-fg-faint)',
        letterSpacing: '0.3em',
        userSelect: 'none',
        opacity: 0.5,
        transition: 'opacity 300ms ease',
        textAlign: 'center',
      }}
      aria-hidden="true"
    >
      {PATTERNS[index]}
    </div>
  );
}
