'use client';

import { useEffect, useRef } from 'react';
import { OBJECTS, SIZE, WORDMARK, drawN, nFit, sampleShape, sourceScale, type ShapePoints } from './shapes';

/**
 * Scroll story for the home page.
 *
 * 1. The hero is still. On scroll the NEXUS logo detaches and comes down;
 *    E·X·U·S slide in behind the N and disappear.
 * 2. The N settles in the sticky stage beside the content, breaks into
 *    particles and becomes one object per chapter ([data-chapter] 0–2).
 *
 * Reads layout from: `.nx-logo h1 img` (hero wordmark), `[data-story-stage]`
 * (sticky target box) and `[data-chapter]` (content sections).
 */
export function LogoStory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heroImg = document.querySelector<HTMLImageElement>('.nx-logo h1 img');
    const stage = document.querySelector<HTMLElement>('[data-story-stage]');
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
    if (!canvas || !heroImg || !stage || chapters.length < OBJECTS.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const count = window.innerWidth < 760 ? 1500 : 2800;
    const seed = Array.from({ length: count }, () => ({
      d: Math.random() * 0.35,
      s: Math.random() < 0.5 ? -1 : 1,
      p: Math.random() * Math.PI * 2,
    }));
    let shapes: ShapePoints[] = [];
    let raf = 0;
    let dpr = 1;
    let start = { x: 0, y: 0, w: 0, h: 0 };
    let lastActive = '';
    const colorCache = new Map<number, string>();

    const img = new Image();
    img.src = heroImg.currentSrc || heroImg.src;

    const measureStart = () => {
      const r = heroImg.getBoundingClientRect();
      start = { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      measureStart();
    };

    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const color = (r: number, g: number, b: number) => {
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let c = colorCache.get(key);
      if (!c) {
        c = `rgb(${(r >> 3) << 3},${(g >> 3) << 3},${(b >> 3) << 3})`;
        colorCache.set(key, c);
      }
      return c;
    };

    /** Scroll positions that drive the timeline. */
    const timeline = () => {
      const vh = window.innerHeight;
      const tops = chapters.map((c) => c.getBoundingClientRect().top + window.scrollY);
      const anchors = tops.map((t) => t - 0.55 * vh);
      const D = 0.45 * vh;
      // Phase A (logo comes down) gets at least 70% of a screen of scrolling,
      // then the N takes at least another 40% to become the first object.
      const aEnd = Math.max(anchors[0] - D, 0.7 * vh);
      const m0End = Math.max(anchors[0], aEnd + 0.4 * vh);
      return { anchors, D, aEnd, m0End };
    };

    const progress = (y: number) => {
      const t = timeline();
      const pA = clamp(y / t.aEnd);
      let f = 0;
      if (y >= t.aEnd) f = clamp((y - t.aEnd) / (t.m0End - t.aEnd));
      for (let i = 1; i < OBJECTS.length; i++) {
        const a = t.anchors[i];
        if (y >= a - t.D) f = i + clamp((y - (a - t.D)) / t.D);
      }
      return { pA, f };
    };

    const box = () => {
      const r = stage.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const cx = r.left + r.width / 2;
      const cy = Math.min(r.top + r.height / 2, stickyTop + r.height / 2);
      const B = Math.min(r.width, r.height) * 0.82;
      return { cx, cy, B };
    };

    const drawParticles = (
      from: ShapePoints,
      to: ShapePoints,
      t: number,
      cx: number,
      cy: number,
      B: number,
      alpha: number,
      now: number,
    ) => {
      const size = Math.max(1.5, B / 230) * dpr;
      const breathe = reduced ? 0 : 0.0028;
      ctx.globalAlpha = alpha;
      const glow: [number, number][] = [];
      for (let k = 0; k < count; k++) {
        const sd = seed[k];
        const e = t <= 0 ? 0 : t >= 1 ? 1 : ease(clamp((t - sd.d) / 0.65));
        const ax = from.x[k];
        const ay = from.y[k];
        const bx = to.x[k];
        const by = to.y[k];
        const swirl = Math.sin(Math.PI * e) * 0.22 * sd.s;
        let x = ax + (bx - ax) * e + (by - ay) * swirl;
        let y = ay + (by - ay) * e - (bx - ax) * swirl;
        x += Math.sin(now * 0.0011 + sd.p) * breathe;
        y += Math.cos(now * 0.0013 + sd.p) * breathe;
        const r = from.r[k] + (to.r[k] - from.r[k]) * e;
        const g = from.g[k] + (to.g[k] - from.g[k]) * e;
        const b = from.b[k] + (to.b[k] - from.b[k]) * e;
        const px = (cx + (x - 0.5) * B) * dpr;
        const py = (cy + (y - 0.5) * B) * dpr;
        ctx.fillStyle = color(r | 0, g | 0, b | 0);
        ctx.fillRect(px, py, size, size);
        if (g > r + 50) glow.push([px, py]);
      }
      // Soft green bloom on accent particles.
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = '#8cea5a';
      const gs = size * 3;
      for (const [px, py] of glow) ctx.fillRect(px - size, py - size, gs, gs);
      ctx.globalAlpha = 1;
    };

    const halo = (cx: number, cy: number, B: number, strength: number) => {
      if (strength <= 0) return;
      const g = ctx.createRadialGradient(cx * dpr, cy * dpr, 0, cx * dpr, cy * dpr, B * 0.7 * dpr);
      g.addColorStop(0, `rgba(140,234,90,${0.1 * strength})`);
      g.addColorStop(0.5, `rgba(255,255,255,${0.03 * strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect((cx - B) * dpr, (cy - B) * dpr, B * 2 * dpr, B * 2 * dpr);
    };

    /** Phase A: the wordmark comes down and E·X·U·S slide behind the N. */
    const drawLetters = (pA: number, cx: number, cy: number, B: number) => {
      const fit = nFit();
      const nFinal = { x: cx - B / 2 + (fit.x / SIZE) * B, y: cy - B / 2 + (fit.y / SIZE) * B, h: (fit.h / SIZE) * B };
      const [nsx] = WORDMARK.letters[0];
      const k = nFinal.h / start.h;
      const wFinal = { w: start.w * k, h: start.h * k, x: nFinal.x - (nsx / WORDMARK.width) * start.w * k, y: nFinal.y };
      const e = ease(clamp(pA / 0.85));
      const W = {
        x: start.x + (wFinal.x - start.x) * e,
        y: start.y + (wFinal.y - start.y) * e,
        w: start.w + (wFinal.w - start.w) * e,
        h: start.h + (wFinal.h - start.h) * e,
      };
      const s = ease(clamp((pA - 0.2) / 0.6));
      const nx = W.x + (nsx / WORDMARK.width) * W.w;
      halo(cx, cy, B, e);
      for (let i = WORDMARK.letters.length - 1; i >= 0; i--) {
        const [sx, ex] = WORDMARK.letters[i];
        const lw = ((ex - sx) / WORDMARK.width) * W.w;
        let lx = W.x + (sx / WORDMARK.width) * W.w;
        let ly = W.y;
        let lh = W.h;
        let alpha = 1;
        if (i > 0) {
          lx = lx + (nx - lx) * s;
          const shrink = 1 - 0.3 * s;
          ly += (lh * (1 - shrink)) / 2;
          lh *= shrink;
          alpha = Math.pow(1 - s, 1.5);
          if (alpha <= 0.01) continue;
        }
        ctx.globalAlpha = alpha;
        const sk = sourceScale(img);
        ctx.drawImage(
          img,
          sx * sk,
          0,
          (ex - sx) * sk,
          WORDMARK.height * sk,
          lx * dpr,
          ly * dpr,
          (i > 0 ? lw * (1 - 0.3 * s) : lw) * dpr,
          lh * dpr,
        );
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!shapes.length) return;

      const { pA, f } = progress(y);
      const { cx, cy, B } = box();
      const floatY = reduced ? 0 : Math.sin(now / 1700) * 4;

      root.style.setProperty('--story-a', reduced ? '0' : pA.toFixed(3));
      const handoff = !reduced && y > 1;
      root.style.setProperty('--story-handoff', handoff ? '1' : '0');

      const active = f > 0.5 ? String(Math.min(OBJECTS.length, Math.round(f)) - 1) : '';
      if (active !== lastActive) {
        stage.dataset.active = active;
        lastActive = active;
      }

      if (cy + B < 0) return; // story has scrolled past

      if (reduced) {
        // No transitions: show the object for the current chapter.
        if (f < 0.5) return;
        const i = Math.min(OBJECTS.length, Math.round(f));
        halo(cx, cy, B, 1);
        drawParticles(shapes[i], shapes[i], 1, cx, cy, B, 1, now);
        return;
      }
      if (!handoff) return;

      if (f <= 0) {
        drawLetters(pA, cx, cy + floatY * pA, B);
        return;
      }
      halo(cx, cy + floatY, B, 1);
      if (f < 1) {
        // The solid N dissolves into particles that become the first object.
        const fit = nFit();
        const fade = 1 - clamp(f * 3);
        if (fade > 0) {
          ctx.globalAlpha = fade;
          const sk = sourceScale(img);
          ctx.drawImage(
            img,
            fit.sx * sk,
            0,
            fit.sw * sk,
            fit.sh * sk,
            (cx - B / 2 + (fit.x / SIZE) * B) * dpr,
            (cy + floatY - B / 2 + (fit.y / SIZE) * B) * dpr,
            (fit.w / SIZE) * B * dpr,
            (fit.h / SIZE) * B * dpr,
          );
          ctx.globalAlpha = 1;
        }
        drawParticles(shapes[0], shapes[1], f, cx, cy + floatY, B, clamp(f * 3), now);
        return;
      }
      const i = Math.min(Math.floor(f), OBJECTS.length);
      const t = f - i;
      drawParticles(shapes[i], shapes[Math.min(i + 1, OBJECTS.length)], i >= OBJECTS.length ? 0 : t, cx, cy + floatY, B, 1, now);
    };

    const ready = () => {
      shapes = [sampleShape(drawN(img), count), ...OBJECTS.map((o) => sampleShape(o.draw, count))];
      root.classList.add('story-ready');
    };

    resize();
    window.addEventListener('resize', resize);
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener('load', ready, { once: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      root.classList.remove('story-ready');
      root.style.removeProperty('--story-a');
      root.style.removeProperty('--story-handoff');
    };
  }, []);

  return <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />;
}
