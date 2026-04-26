/**
 * LiquidField — Shared 2D wave simulation engine.
 *
 * NOT a visual canvas overlay. This is a pure physics simulation
 * that maintains a wave height-field across the viewport. Elements
 * (via LiquidElement) sample this field at their position to get
 * displacement, tilt, and bob values — making them behave like
 * objects floating on water disturbed by the mouse cursor.
 *
 * Mount once in your layout. It creates a global simulation that
 * LiquidElement instances read from via window.__liquidField.
 */

import { useEffect, useRef, useCallback } from 'react';

// Grid cell count (low-res is fine — we interpolate)
const GRID = 64;

export interface LiquidSample {
  /** Vertical displacement at this point */
  height: number;
  /** Horizontal gradient (tilt X) */
  gradX: number;
  /** Vertical gradient (tilt Y) */
  gradY: number;
}

// Shared global for LiquidElement to read from
declare global {
  interface Window {
    __liquidField?: {
      sample: (screenX: number, screenY: number) => LiquidSample;
      active: boolean;
    };
  }
}

export default function LiquidField() {
  const rafRef = useRef<number>(0);

  const boot = useCallback(() => {
    const N = GRID;
    let current = new Float32Array(N * N);
    let previous = new Float32Array(N * N);

    const viscosity = 0.955;
    const mouseRadius = 4; // grid cells

    let mouseX = -1;
    let mouseY = -1;
    let pmouseX = -1;
    let pmouseY = -1;
    let mouseActive = false;

    // Expose sampling function to LiquidElement instances
    const sample = (screenX: number, screenY: number): LiquidSample => {
      // Map screen coords to grid coords
      const gx = (screenX / window.innerWidth) * N;
      const gy = (screenY / window.innerHeight) * N;

      // Bilinear interpolation for smooth sampling
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = Math.min(x0 + 1, N - 1);
      const y1 = Math.min(y0 + 1, N - 1);
      const fx = gx - x0;
      const fy = gy - y0;

      if (x0 < 0 || x0 >= N || y0 < 0 || y0 >= N) {
        return { height: 0, gradX: 0, gradY: 0 };
      }

      // Interpolate height
      const h00 = current[y0 * N + x0];
      const h10 = current[y0 * N + x1];
      const h01 = current[y1 * N + x0];
      const h11 = current[y1 * N + x1];
      const height = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) +
                     h01 * (1 - fx) * fy + h11 * fx * fy;

      // Compute gradients for tilt
      const left = x0 > 0 ? current[y0 * N + (x0 - 1)] : 0;
      const right = x1 < N - 1 ? current[y0 * N + (x1 + 1)] : 0;
      const up = y0 > 0 ? current[(y0 - 1) * N + x0] : 0;
      const down = y1 < N - 1 ? current[(y1 + 1) * N + x0] : 0;

      return {
        height,
        gradX: (right - left) * 0.5,
        gradY: (down - up) * 0.5,
      };
    };

    window.__liquidField = { sample, active: true };

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseActive) {
        pmouseX = e.clientX;
        pmouseY = e.clientY;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    };

    const onMouseLeave = () => {
      mouseActive = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (!mouseActive) {
        pmouseX = t.clientX;
        pmouseY = t.clientY;
      }
      mouseX = t.clientX;
      mouseY = t.clientY;
      mouseActive = true;
    };

    const onTouchEnd = () => { mouseActive = false; };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Physics loop — runs at ~60fps
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      // Inject disturbance at mouse position
      if (mouseActive && mouseX >= 0) {
        const gx = (mouseX / window.innerWidth) * N;
        const gy = (mouseY / window.innerHeight) * N;
        const vx = mouseX - pmouseX;
        const vy = mouseY - pmouseY;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const force = Math.min(speed * 0.15, 3);

        for (let dy = -mouseRadius; dy <= mouseRadius; dy++) {
          for (let dx = -mouseRadius; dx <= mouseRadius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > mouseRadius) continue;

            const ix = Math.round(gx + dx);
            const iy = Math.round(gy + dy);
            if (ix < 1 || ix >= N - 1 || iy < 1 || iy >= N - 1) continue;

            const falloff = 1 - dist / mouseRadius;
            current[iy * N + ix] += force * falloff * falloff;
          }
        }

        pmouseX = mouseX;
        pmouseY = mouseY;
      }

      // Wave equation propagation
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          const idx = y * N + x;
          previous[idx] =
            ((current[(y - 1) * N + x] +
              current[(y + 1) * N + x] +
              current[y * N + (x - 1)] +
              current[y * N + (x + 1)]) /
              2 -
              previous[idx]) *
            viscosity;
        }
      }

      // Swap
      const tmp = current;
      current = previous;
      previous = tmp;

      // Keep the reference fresh for sampling
      if (window.__liquidField) {
        window.__liquidField.sample = (sx, sy) => sample(sx, sy);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (window.__liquidField) window.__liquidField.active = false;
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return boot();
  }, [boot]);

  // No DOM output — this is a pure physics engine
  return null;
}
