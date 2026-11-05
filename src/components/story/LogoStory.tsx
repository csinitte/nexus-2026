'use client';

import { useEffect, useRef } from 'react';
import { OBJECTS, SIZE, WORDMARK, drawN, nFit, sampleShape, sourceScale, type ShapePoints } from './shapes';

/**
 * Scroll story for the home page.
 *
 * The hero and the three chapters ([data-chapter] 0–2) behave like pages:
 * a small scroll (wheel tick, short swipe, arrow / Page keys) glides to the
 * next page and the whole transition plays on its own timing:
 *
 * 1. Hero → About: the NEXUS logo detaches and comes down, E·X·U·S slide in
 *    behind the N, then the N breaks into particles and becomes a network.
 * 2. About → Hosts → Innovation: the object morphs into the next one.
 *
 * Scrolling up plays it in reverse. In chapters taller than the screen each
 * small scroll glides most of a screen; after the last chapter the page
 * scrolls normally.
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

    const mobile = window.matchMedia('(max-width: 860px)');
    const stickyTop = () => parseFloat(getComputedStyle(stage).top) || 0;

    /** Scroll position of each page: hero, then each chapter just below the header (and band on mobile). */
    const targets = () => {
      const offset = stickyTop() + (mobile.matches ? stage.offsetHeight - 8 : 0);
      return [0, ...chapters.map((c) => Math.max(0, Math.round(c.getBoundingClientRect().top + window.scrollY - offset)))];
    };
    const lastChapterEnd = () => {
      const r = chapters[chapters.length - 1].getBoundingClientRect();
      return r.bottom + window.scrollY;
    };
    /** Which page the animation should show for a scroll position. */
    const pageFor = (y: number, T: number[]) => {
      const vh = window.innerHeight;
      let i = 0;
      for (let k = 1; k < T.length; k++) if (y >= T[k] - 0.5 * vh) i = k;
      return i;
    };

    /** Animated page value: 0 = hero, 1–3 = chapters. Moves at a fixed speed toward the current page. */
    let v = -1;
    let lastNow = 0;
    const segmentMs = (seg: number) => (seg < 1 ? 1800 : 1200);
    const step = (target: number, now: number) => {
      const dt = Math.min(64, now - (lastNow || now));
      lastNow = now;
      if (v < 0 || reduced) {
        v = target;
        return;
      }
      if (v < target) v = Math.min(target, v + dt / segmentMs(Math.floor(v)));
      else if (v > target) v = Math.max(target, v - dt / segmentMs(Math.ceil(v) - 1));
    };
    /** Maps the page value to the drawing phases: pA = logo coming down, f = shape index (0 = N). */
    const phases = () => {
      if (v <= 0) return { pA: 0, f: 0 };
      if (v < 1) return v < 0.55 ? { pA: v / 0.55, f: 0 } : { pA: 1, f: (v - 0.55) / 0.45 };
      return { pA: 1, f: v };
    };

    const box = () => {
      const r = stage.getBoundingClientRect();
      const top = stickyTop();
      const cx = r.left + r.width / 2;
      const cy = Math.min(r.top + r.height / 2, top + r.height / 2);
      const B = Math.min(r.width, r.height) * 0.82;
      // Once the stage is pinned, keep the sliding letters out of the text column.
      const clipRight = r.top <= top + 1 ? r.right : Infinity;
      return { cx, cy, B, clipRight };
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
    const drawLetters = (pA: number, cx: number, cy: number, B: number, clipRight: number) => {
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
      // E·X·U·S tuck in behind the N early, before the page lands next to the content.
      const s = ease(clamp((pA - 0.05) / 0.5));
      const nx = W.x + (nsx / WORDMARK.width) * W.w;
      halo(cx, cy, B, e);
      ctx.save();
      if (Number.isFinite(clipRight)) {
        ctx.beginPath();
        ctx.rect(0, 0, clipRight * dpr, canvas.height);
        ctx.clip();
      }
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
          alpha = Math.pow(1 - s, 2);
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
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!shapes.length) return;

      step(pageFor(y, targets()), now);
      const { pA, f } = phases();
      const { cx, cy, B, clipRight } = box();
      const floatY = reduced ? 0 : Math.sin(now / 1700) * 4;

      root.style.setProperty('--story-a', reduced ? '0' : pA.toFixed(3));
      const handoff = !reduced && v > 0.001;
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
        drawLetters(pA, cx, cy + floatY * pA, B, clipRight);
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

    /* ---------- Page navigation: a small scroll moves a whole page ---------- */
    let locked = false;
    let unlockTimer = 0;
    let lastWheel = 0;
    let gestureUsed = false;

    const goto = (dest: number) => {
      locked = true;
      gestureUsed = true;
      window.scrollTo({ top: dest, behavior: 'smooth' });
      window.clearTimeout(unlockTimer);
      const unlock = () => {
        window.clearTimeout(unlockTimer);
        window.removeEventListener('scrollend', unlock);
        unlockTimer = window.setTimeout(() => (locked = false), 120);
      };
      window.addEventListener('scrollend', unlock, { once: true });
      unlockTimer = window.setTimeout(unlock, 1100);
    };

    /** Where a scroll in `dir` should glide to, or null to let the page scroll normally. */
    const destination = (dir: 1 | -1): number | null => {
      if (root.classList.contains('intro-playing') || root.classList.contains('menu-open')) return null;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const T = targets();
      const last = T.length - 1;
      const end = lastChapterEnd();
      let i = 0;
      for (let k = 1; k < T.length; k++) if (y >= T[k] - 2) i = k;
      const bottom = (k: number) => (k < last ? T[k + 1] : end);
      const overflows = (k: number) => k > 0 && bottom(k) - T[k] > vh * 1.15;

      if (dir > 0) {
        if (i >= last) return null; // last chapter and footer scroll normally
        const remaining = bottom(i) - (y + vh);
        // Tall chapter: glide most of a screen further before moving to the next page.
        if (overflows(i) && remaining > vh * 0.3) return Math.round(y + Math.min(remaining, vh * 0.85));
        return T[i + 1];
      }
      if (y <= 2) return null;
      if (i === last && y > end - vh * 0.5) return null; // in the footer area
      if (y > T[i] + 2) {
        if (overflows(i) && y - T[i] > vh * 0.3) return Math.round(y - Math.min(y - T[i], vh * 0.85));
        return T[i];
      }
      const prev = i - 1;
      if (prev < 0) return null;
      return overflows(prev) ? Math.max(T[prev], T[i] - vh) : T[prev];
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const now = performance.now();
      const newGesture = now - lastWheel > 200;
      lastWheel = now;
      if (newGesture) gestureUsed = false;
      if (locked) return e.preventDefault();
      if (Math.abs(e.deltaY) < 2) return;
      const dest = destination(e.deltaY > 0 ? 1 : -1);
      if (dest === null) return;
      e.preventDefault();
      if (!gestureUsed) goto(dest); // one page per gesture, even with trackpad momentum
    };

    let touchY = 0;
    let touchUsed = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchUsed = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (locked) return e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 10) return;
      const dest = destination(dy > 0 ? 1 : -1);
      if (dest === null) return;
      e.preventDefault();
      if (!touchUsed && Math.abs(dy) > 30) {
        touchUsed = true;
        goto(dest);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!down && !up) return;
      if (locked) return e.preventDefault();
      const dest = destination(down ? 1 : -1);
      if (dest === null) return;
      e.preventDefault();
      goto(dest);
    };

    if (!reduced) {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKey);
    }

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
      window.clearTimeout(unlockTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      root.classList.remove('story-ready');
      root.style.removeProperty('--story-a');
      root.style.removeProperty('--story-handoff');
    };
  }, []);

  return <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />;
}
