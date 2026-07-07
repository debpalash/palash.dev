interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkle: number;
  phase: number;
  vx: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export function initStarfield(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars: Star[] = [];
  let meteor: Meteor | null = null;
  let nextMeteorAt = performance.now() + 4000 + Math.random() * 8000;
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.floor((innerWidth * innerHeight) / 4500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() < 0.85 ? Math.random() * 1.1 + 0.3 : Math.random() * 1.8 + 1,
      alpha: 0.25 + Math.random() * 0.65,
      twinkle: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      vx: 0.008 + Math.random() * 0.02,
    }));
  }

  function draw(t: number) {
    ctx!.clearRect(0, 0, innerWidth, innerHeight);

    for (const s of stars) {
      if (!reduced) {
        s.x -= s.vx;
        if (s.x < -2) s.x = innerWidth + 2;
      }
      const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t / 1000 * s.twinkle + s.phase);
      const a = s.alpha * tw;
      // phosphor-tinted stars: mostly pale green-white, a few amber
      const amber = s.phase > 5.8;
      ctx!.fillStyle = amber
        ? `rgba(255, 190, 90, ${a * 0.8})`
        : `rgba(190, 255, 205, ${a})`;
      ctx!.fillRect(s.x, s.y, s.r, s.r);
    }

    if (!reduced) {
      if (!meteor && t > nextMeteorAt) {
        const fromLeft = Math.random() < 0.5;
        meteor = {
          x: fromLeft ? -20 : Math.random() * innerWidth,
          y: fromLeft ? Math.random() * innerHeight * 0.5 : -20,
          vx: 4 + Math.random() * 4,
          vy: 2 + Math.random() * 2,
          life: 1,
        };
      }
      if (meteor) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.012;
        const grad = ctx!.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * 10, meteor.y - meteor.vy * 10,
        );
        grad.addColorStop(0, `rgba(200, 255, 215, ${Math.max(meteor.life, 0)})`);
        grad.addColorStop(1, 'rgba(200, 255, 215, 0)');
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(meteor.x, meteor.y);
        ctx!.lineTo(meteor.x - meteor.vx * 10, meteor.y - meteor.vy * 10);
        ctx!.stroke();
        if (meteor.life <= 0 || meteor.x > innerWidth + 40 || meteor.y > innerHeight + 40) {
          meteor = null;
          nextMeteorAt = t + 5000 + Math.random() * 10000;
        }
      }
    }
  }

  function loop(t: number) {
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduced) {
    draw(0);
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(loop);
      }
    });
  }
}
