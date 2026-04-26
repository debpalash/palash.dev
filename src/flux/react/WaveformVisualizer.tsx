import { useRef, useEffect } from 'react';

interface Props {
  barCount?: number;
  height?: number;
  color?: string;
}

export default function WaveformVisualizer({ barCount = 48, height = 64, color }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bars = container.querySelectorAll<HTMLDivElement>('.wv-bar');
    let frame: number;

    const animate = (t: number) => {
      bars.forEach((bar, i) => {
        const offset = (i / barCount) * Math.PI * 4;
        const val = Math.sin(t * 0.002 + offset) * 0.4 + 0.5;
        bar.style.height = `${val * height}px`;
        bar.style.opacity = `${0.3 + val * 0.7}`;
      });
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [barCount, height]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        height: `${height}px`,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="wv-bar"
          style={{
            flex: 1,
            borderRadius: '1px',
            background: color || 'var(--flux-accent)',
            height: `${Math.random() * height}px`,
            transition: 'height 100ms ease',
          }}
        />
      ))}
    </div>
  );
}
