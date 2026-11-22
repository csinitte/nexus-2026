'use client';

import { useEffect, useRef } from 'react';

/**
 * 3D particle terrain — a grid of glowing points rolling like a signal wave,
 * seen in perspective. Tilts toward the pointer. Canvas 2D, no dependencies.
 * Pauses off-screen; renders one still frame for reduced motion.
 */
export function WaveField({ className = 'p2-wave', density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COLS = Math.round(46 * density);
    const ROWS = Math.round(26 * density);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let visible = true;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const height = (x: number, z: number) =>
      Math.sin(x * 0.35 + t * 1.1) * 0.55 +
      Math.cos(z * 0.45 - t * 0.8) * 0.45 +
      Math.sin((x + z) * 0.22 + t * 0.6) * 0.5 +
      Math.exp(-((x - COLS * 0.62) ** 2 + (z - ROWS * 0.45) ** 2) / 60) * 1.6;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      tilt.x += (tilt.tx - tilt.x) * 0.04;
      tilt.y += (tilt.ty - tilt.y) * 0.04;
      const pitch = 0.95 + tilt.y * 0.12;
      const yaw = -0.35 + tilt.x * 0.25 + Math.sin(t * 0.15) * 0.06;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const scale = Math.min(w, h * 1.6) / 30;

      const pts: { x: number; y: number; d: number; v: number }[][] = [];
      for (let j = 0; j < ROWS; j++) {
        const row: { x: number; y: number; d: number; v: number }[] = [];
        for (let i = 0; i < COLS; i++) {
          const x0 = i - COLS / 2;
          const z0 = j - ROWS / 2;
          const v = height(i, j);
          // yaw around Y, then pitch around X
          const x1 = x0 * cosY - z0 * sinY;
          const z1 = x0 * sinY + z0 * cosY;
          const y1 = -v * 1.4;
          const y2 = y1 * cosP - z1 * sinP;
          const z2 = y1 * sinP + z1 * cosP;
          const persp = 34 / (34 + z2);
          row.push({ x: w * 0.55 + x1 * scale * persp, y: h * 0.62 + y2 * scale * persp, d: persp, v });
        }
        pts.push(row);
      }

      // row lines
      for (let j = 0; j < ROWS; j++) {
        const depth = j / ROWS;
        ctx.strokeStyle = `rgba(140,234,90,${0.05 + depth * 0.16})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        pts[j].forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      }
      // points
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const p = pts[j][i];
          const peak = Math.max(0, p.v - 0.6);
          const a = Math.min(1, 0.15 + (j / ROWS) * 0.55 + peak * 0.5);
          const r = 0.5 + p.d * 1.1 + peak * 1.2;
          if (peak > 0.55) {
            ctx.fillStyle = `rgba(200,255,170,${Math.min(0.35, peak * 0.25)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = peak > 0.55 ? `rgba(230,255,215,${a})` : `rgba(140,234,90,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      if (visible) {
        t += 0.016;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tilt.tx = (e.clientX / innerWidth - 0.5) * 2;
      tilt.ty = (e.clientY / innerHeight - 0.5) * 2;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    addEventListener('pointermove', onMove, { passive: true });
    if (reduced) {
      t = 2;
      draw();
    } else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener('pointermove', onMove);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
