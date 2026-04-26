import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';

interface Drip {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number; // slight horizontal drift while falling
}

interface Props {
  children: ReactNode;
  /** Number of drips per wave */
  dripCount?: number;
  /** Max fall distance in px */
  dripDistance?: number;
  /** Drip color */
  dripColor?: string;
  /** Extra CSS classes */
  className?: string;
}

let dripId = 0;

/**
 * LiquidDrip — Visible liquid droplets that form and drip on hover.
 * Uses a lighter gooey filter so droplets remain visible as they detach.
 */
export default function LiquidDrip({
  children,
  dripCount = 4,
  dripDistance = 45,
  dripColor,
  className = '',
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [drips, setDrips] = useState<Drip[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const spawnDrips = useCallback(() => {
    const batch: Drip[] = [];
    for (let i = 0; i < dripCount; i++) {
      batch.push({
        id: ++dripId,
        x: 8 + Math.random() * 84,
        size: 5 + Math.random() * 5,
        delay: i * 120 + Math.random() * 200,
        duration: 800 + Math.random() * 500,
        drift: (Math.random() - 0.5) * 6,
      });
    }
    setDrips(prev => [...prev.slice(-8), ...batch]); // keep max ~12
  }, [dripCount]);

  const onEnter = useCallback(() => {
    setHovered(true);
    spawnDrips();
    intervalRef.current = setInterval(spawnDrips, 1400);
  }, [spawnDrips]);

  const onLeave = useCallback(() => {
    setHovered(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Let existing drips finish animating, then clear
    setTimeout(() => setDrips([]), 1500);
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const color = dripColor || 'var(--flux-accent)';

  return (
    <div
      className={`flux-liquid-drip ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}

      {/* Drip container with its own lighter gooey filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="flux-drip-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -5" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'visible',
          filter: 'url(#flux-drip-gooey)',
          zIndex: 0,
        }}
      >
        {/* Liquid pool at bottom edge that drips connect to */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              bottom: -1,
              left: '5%',
              right: '5%',
              height: 6,
              borderRadius: '0 0 4px 4px',
              background: color,
              opacity: 0.6,
            }}
          />
        )}

        {/* Individual droplets */}
        {drips.map((drip) => (
          <span
            key={drip.id}
            style={{
              position: 'absolute',
              bottom: -2,
              left: `${drip.x}%`,
              width: drip.size,
              height: drip.size,
              borderRadius: '50%',
              background: color,
              opacity: 0.85,
              pointerEvents: 'none',
              animation: `fluxDripFall ${drip.duration}ms cubic-bezier(0.55, 0, 1, 0.45) ${drip.delay}ms both`,
              ['--drip-dist' as string]: `${dripDistance}px`,
              ['--drip-drift' as string]: `${drip.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Wet sheen on hover */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
            animation: 'fluxWetSheen 1.5s ease-in-out',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      <style>{`
        @keyframes fluxDripFall {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.85;
            border-radius: 50%;
          }
          15% {
            transform: translateY(3px) translateX(0) scaleX(0.6) scaleY(1.6);
            opacity: 0.9;
            border-radius: 45% 45% 50% 50%;
          }
          40% {
            transform: translateY(calc(var(--drip-dist) * 0.4)) translateX(calc(var(--drip-drift) * 0.5)) scaleX(0.85) scaleY(1.1);
            opacity: 0.8;
            border-radius: 50%;
          }
          85% {
            transform: translateY(calc(var(--drip-dist) * 0.85)) translateX(var(--drip-drift)) scale(0.9);
            opacity: 0.4;
          }
          100% {
            transform: translateY(var(--drip-dist)) translateX(var(--drip-drift)) scaleX(1.3) scaleY(0.5);
            opacity: 0;
            border-radius: 50%;
          }
        }
        @keyframes fluxWetSheen {
          0% { transform: translateX(-100%); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
