'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#8cea5a', '#a6f77a', '#c8ffb0', '#ececec', '#7fdc4c'];

/** One-shot burst of small diamonds from the centre of its box. Fires when `fire` changes to true. */
export function Confetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width: w, height: h } = canvas.getBoundingClientRect();
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const parts = Array.from({ length: 140 }, () => {
      const a = Math.random() * Math.PI * 2;
      const v = 4 + Math.random() * 9;
      return {
        x: w * 0.25,
        y: h * 0.5,
        vx: Math.cos(a) * v * 1.3,
        vy: Math.sin(a) * v - 5,
        s: 3 + Math.random() * 5,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1,
      };
    });

    let raf = 0;
    let started = false;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of parts) {
        if (p.life <= 0) continue;
        alive++;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= 0.0065;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.lineTo(p.s * 0.6, 0);
        ctx.lineTo(0, p.s);
        ctx.lineTo(-p.s * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    // Let the winner scroll into view first.
    const delay = setTimeout(() => {
      started = true;
      raf = requestAnimationFrame(tick);
    }, 650);
    return () => {
      clearTimeout(delay);
      if (started) cancelAnimationFrame(raf);
    };
  }, [fire]);

  return <canvas ref={ref} className="p2-confetti" aria-hidden="true" />;
}
