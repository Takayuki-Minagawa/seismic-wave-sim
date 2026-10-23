import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
}

const COLORS = ['#38bdf8', '#a78bfa', '#fb7185', '#fbbf24', '#4ade80', '#f472b6'];

/** Full-screen confetti layer; bursts whenever `celebrate()` is called. */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let particles: Particle[] = [];
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life > 0 && p.y < canvas.height + 20);
      for (const p of particles) {
        p.vy += 0.25;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      raf = particles.length > 0 ? requestAnimationFrame(tick) : 0;
    };

    const burst = () => {
      const w = canvas.width;
      for (let i = 0; i < 140; i++) {
        const fromLeft = i % 2 === 0;
        particles.push({
          x: fromLeft ? w * 0.15 : w * 0.85,
          y: canvas.height * 0.75,
          vx: (fromLeft ? 1 : -1) * (3 + Math.random() * 7),
          vy: -(9 + Math.random() * 9),
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          size: 6 + Math.random() * 6,
          color: COLORS[i % COLORS.length],
          life: 140 + Math.random() * 60,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('seismic:celebrate', burst);
    return () => {
      window.removeEventListener('seismic:celebrate', burst);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden />;
}
