import { useRef, useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** How strongly this element reacts to waves (px) — keep subtle */
  amplitude?: number;
  /** Tilt sensitivity (degrees per unit gradient) — keep low */
  tiltStrength?: number;
  /** Direct push-away distance when cursor is very close (px) */
  pushStrength?: number;
  /** Radius for direct push-away (px) */
  pushRadius?: number;
  /** Extra CSS classes */
  className?: string;
}

/**
 * LiquidElement — Makes an element behave like an object floating on water.
 *
 * Reads from the shared LiquidField wave simulation to get:
 * - displacement (translate Y) from wave height at this element's position
 * - tilt (rotateX/Y) from the wave gradient at this position
 * - direct push-away (translate X/Y) when cursor is very close
 *
 * The result: elements bob, tilt, and shift as ripples propagate
 * through them, like leaves floating on a pond disturbed by a stick.
 */
export default function LiquidElement({
  children,
  amplitude = 5,
  tiltStrength = 0.8,
  pushStrength = 4,
  pushRadius = 120,
  className = '',
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    // Smoothed values (for spring interpolation)
    tx: 0, ty: 0, rx: 0, ry: 0,
    // Velocities for spring
    vtx: 0, vty: 0, vrx: 0, vry: 0,
    // Mouse
    mx: -9999, my: -9999,
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = elRef.current;
    if (!el) return;

    let frame: number;

    const onMouseMove = (e: MouseEvent) => {
      stateRef.current.mx = e.clientX;
      stateRef.current.my = e.clientY;
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const s = stateRef.current;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Target values from wave field
      let targetTX = 0;
      let targetTY = 0;
      let targetRX = 0;
      let targetRY = 0;

      // 1. Sample wave field for bob + tilt
      const field = window.__liquidField;
      if (field?.active) {
        const sample = field.sample(cx, cy);

        // Wave height → vertical displacement (bob)
        targetTY += sample.height * amplitude;

        // Wave gradient → tilt (like a floating object tilting on a wave)
        targetRX += sample.gradY * tiltStrength * -8;
        targetRY += sample.gradX * tiltStrength * 8;

        // Wave gradient → slight horizontal drift
        targetTX += sample.gradX * amplitude * 0.4;
      }

      // 2. Direct cursor push-away (close proximity)
      const dx = cx - s.mx;
      const dy = cy - s.my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pushRadius && dist > 1) {
        const t = 1 - dist / pushRadius;
        const force = t * t * t * pushStrength; // cubic falloff
        targetTX += (dx / dist) * force;
        targetTY += (dy / dist) * force;
      }

      // Spring physics — smooth interpolation toward targets
      const stiffness = 0.06;
      const damping = 0.78;

      s.vtx = (s.vtx + (targetTX - s.tx) * stiffness) * damping;
      s.vty = (s.vty + (targetTY - s.ty) * stiffness) * damping;
      s.vrx = (s.vrx + (targetRX - s.rx) * stiffness) * damping;
      s.vry = (s.vry + (targetRY - s.ry) * stiffness) * damping;

      s.tx += s.vtx;
      s.ty += s.vty;
      s.rx += s.vrx;
      s.ry += s.vry;

      // Apply transform if significant
      const moving = Math.abs(s.tx) > 0.05 || Math.abs(s.ty) > 0.05 ||
                     Math.abs(s.rx) > 0.05 || Math.abs(s.ry) > 0.05;

      if (moving) {
        el.style.transform =
          `translate(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px) ` +
          `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      } else {
        el.style.transform = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [amplitude, tiltStrength, pushStrength, pushRadius]);

  return (
    <div
      ref={elRef}
      className={`flux-liquid-element ${className}`}
      style={{ willChange: 'transform', perspective: '800px' }}
    >
      {children}
    </div>
  );
}
