'use client';

import { useEffect, useRef } from 'react';
import { OBJECTS, SIZE, WORDMARK, drawN, nFit, sampleShape, sourceScale, type ShapePoints } from './shapes';

/**
 * Controller for the home page deck ([data-deck]): four full-screen pages —
 * hero (0), About (1), Hosts (2), Innovation (3). Nothing scrolls inside a
 * page; a small scroll, swipe, arrow/Page key or page dot moves one page and
 * the whole transition plays on its own timing:
 *
 *   0 → 1  The hero fades and the whole NEXUS logo comes down onto the blank
 *          page; the N moves to the centre while E·X·U·S slide into it; the
 *          N breaks into particles and becomes the first object; the page's
 *          info slides in from the left and right.
 *   1 → 2 → 3  Info slides out, the object morphs, the next info slides in.
 *
 * Going back reverses it. Below page 3 the document scrolls normally to the
 * footer. Reduced motion: same paging, no transitions.
 */
export function LogoStory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const deck = document.querySelector<HTMLElement>('[data-deck]');
    const heroImg = document.querySelector<HTMLImageElement>('.nx-logo h1 img');
    const pages = Array.from(document.querySelectorAll<HTMLElement>('[data-deck-page]'));
    const centers = Array.from(document.querySelectorAll<HTMLElement>('[data-deck-center]'));
    if (!canvas || !deck || !heroImg || pages.length !== OBJECTS.length + 1 || !centers.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const LAST = pages.length - 1;
    const HASHES = ['', '#about', '#hosts', '#explore'];
    const count = window.innerWidth < 760 ? 1400 : 2600;
    const seed = Array.from({ length: count }, () => ({
      d: Math.random() * 0.35,
      s: Math.random() < 0.5 ? -1 : 1,
      p: Math.random() * Math.PI * 2,
    }));
    const colorCache = new Map<number, string>();
    const offsetX = new Float32Array(count);
    const offsetY = new Float32Array(count);
    const pointer = { x: 0, y: 0, active: false };
    let shapes: ShapePoints[] = [];
    let raf = 0;
    let dpr = 1;
    let start = { x: 0, y: 0, w: 0, h: 0 };

    const img = new Image();
    img.src = heroImg.currentSrc || heroImg.src;

    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const color = (r: number, g: number, b: number) => {
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let c = colorCache.get(key);
      if (!c) colorCache.set(key, (c = `rgb(${(r >> 3) << 3},${(g >> 3) << 3},${(b >> 3) << 3})`));
      return c;
    };

    const measure = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const r = heroImg.getBoundingClientRect();
      start = { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
    };

    /** Centre box where objects are drawn; glides between pages whose centre boxes differ (mobile). */
    const box = () => {
      const rectOf = (pageIndex: number) => {
        const r = centers[Math.max(0, Math.min(centers.length - 1, pageIndex - 1))].getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, B: Math.min(r.width, r.height) * 0.86 };
      };
      const lo = Math.max(1, Math.floor(v));
      const hi = Math.max(1, Math.ceil(v));
      const a = rectOf(lo);
      if (hi === lo) return a;
      const b = rectOf(hi);
      const t = ease(v - Math.floor(v));
      return { cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), B: lerp(a.B, b.B, t) };
    };

    /* ---------- Page state ---------- */
    let page = 0;
    /** Animated page value: 0 = hero … 3 = Innovation. */
    let v = 0;
    let lastNow = 0;
    const segmentMs = (seg: number) => (seg < 1 ? 2600 : 1300);

    const setPage = (next: number, animate = true) => {
      next = Math.max(0, Math.min(LAST, next));
      const from = page;
      page = next;
      // Info enters after the object has formed; the hero returns after the logo is back.
      deck.style.setProperty('--enter-delay', from === 0 && next > 0 && animate ? '2.15s' : '0.75s');
      // Returning home: the robot, orbit and text arrive only once the logo has settled back into place.
      deck.style.setProperty('--hero-delay', next === 0 && from > 0 && animate ? `${segmentMs(0) / 1000 - 0.05}s` : '0s');
      deck.dataset.page = String(next);
      pages.forEach((p, i) => {
        p.classList.toggle('is-active', i === next);
        p.inert = i !== next;
      });
      deck
        .querySelectorAll<HTMLElement>('.deck-dots button')
        .forEach((b, i) => b.setAttribute('aria-current', i === next ? 'step' : 'false'));
      if (!animate || reduced) v = next;
      history.replaceState(null, '', HASHES[next] || window.location.pathname + window.location.search);
    };

    const step = (now: number) => {
      const dt = Math.min(64, now - (lastNow || now));
      lastNow = now;
      if (v < page) v = Math.min(page, v + dt / segmentMs(Math.floor(v)));
      else if (v > page) v = Math.max(page, v - dt / segmentMs(Math.ceil(v) - 1));
    };

    /* ---------- Drawing ---------- */
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
      const size = Math.max(1.4, B / 220) * dpr;
      const breathe = reduced ? 0 : 0.0028;
      const glow: number[] = [];
      ctx.globalAlpha = alpha;
      for (let k = 0; k < count; k++) {
        const sd = seed[k];
        const e = t <= 0 ? 0 : t >= 1 ? 1 : ease(clamp((t - sd.d) / 0.65));
        const ax = from.x[k];
        const ay = from.y[k];
        const bx = to.x[k];
        const by = to.y[k];
        const swirl = Math.sin(Math.PI * e) * 0.22 * sd.s;
        const x = ax + (bx - ax) * e + (by - ay) * swirl + Math.sin(now * 0.0011 + sd.p) * breathe;
        const y = ay + (by - ay) * e - (bx - ax) * swirl + Math.cos(now * 0.0013 + sd.p) * breathe;
        const r = from.r[k] + (to.r[k] - from.r[k]) * e;
        const g = from.g[k] + (to.g[k] - from.g[k]) * e;
        const b = from.b[k] + (to.b[k] - from.b[k]) * e;
        const baseX = cx + (x - 0.5) * B;
        const baseY = cy + (y - 0.5) * B;
        let pushX = 0;
        let pushY = 0;
        if (!reduced && pointer.active) {
          const dx = baseX - pointer.x;
          const dy = baseY - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = 100;
          if (distance < radius) {
            const strength = (1 - distance / radius) ** 2 * 55;
            const angle = distance > 0.01 ? Math.atan2(dy, dx) : sd.p;
            pushX = Math.cos(angle) * strength;
            pushY = Math.sin(angle) * strength;
          }
        }
        offsetX[k] += (pushX - offsetX[k]) * 0.16;
        offsetY[k] += (pushY - offsetY[k]) * 0.16;
        const px = (baseX + offsetX[k]) * dpr;
        const py = (baseY + offsetY[k]) * dpr;
        ctx.fillStyle = color(r | 0, g | 0, b | 0);
        ctx.fillRect(px, py, size, size);
        if (g > r + 50) glow.push(px, py);
      }
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = '#8cea5a';
      for (let i = 0; i < glow.length; i += 2) ctx.fillRect(glow[i] - size, glow[i + 1] - size, size * 3, size * 3);
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

    const nRect = (cx: number, cy: number, B: number) => {
      const f = nFit();
      return { x: cx - B / 2 + (f.x / SIZE) * B, y: cy - B / 2 + (f.y / SIZE) * B, w: (f.w / SIZE) * B, h: (f.h / SIZE) * B };
    };

    /**
     * Logo choreography for v in [0, 0.6]:
     *  a1 (0–0.3)   the whole wordmark comes down to the middle of the blank page;
     *  a2 (0.3–0.6) the N moves to the centre and grows while E·X·U·S slide into it.
     */
    const drawLogo = (a1: number, a2: number, cx: number, cy: number, B: number) => {
      const sk = sourceScale(img);
      const e1 = ease(a1);
      const e2 = ease(a2);
      const mid = { x: window.innerWidth / 2 - start.w / 2, y: cy - start.h / 2 };
      const W = { x: lerp(start.x, mid.x, e1), y: lerp(start.y - window.scrollY, mid.y, e1), w: start.w, h: start.h };
      const [nsx, nex] = WORDMARK.letters[0];
      const nIn = { x: W.x + (nsx / WORDMARK.width) * W.w, w: ((nex - nsx) / WORDMARK.width) * W.w };
      const nFinal = nRect(cx, cy, B);
      const N = { x: lerp(nIn.x, nFinal.x, e2), y: lerp(W.y, nFinal.y, e2), w: lerp(nIn.w, nFinal.w, e2), h: lerp(W.h, nFinal.h, e2) };
      halo(cx, cy, B, e2);
      // E·X·U·S slide into the N and disappear behind it.
      for (let i = WORDMARK.letters.length - 1; i >= 1; i--) {
        const [sx, ex] = WORDMARK.letters[i];
        const lw = ((ex - sx) / WORDMARK.width) * W.w;
        const lx0 = W.x + (sx / WORDMARK.width) * W.w;
        const scale = lerp(1, 0.55, e2);
        const lx = lerp(lx0, N.x + N.w / 2 - (lw * scale) / 2, e2);
        const lh = lerp(W.h, N.h * 0.7, e2);
        const ly = lerp(W.y, N.y + (N.h - lh) / 2, e2);
        const alpha = Math.pow(1 - e2, 1.6);
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, sx * sk, 0, (ex - sx) * sk, WORDMARK.height * sk, lx * dpr, ly * dpr, lw * scale * dpr, lh * dpr);
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(img, nsx * sk, 0, (nex - nsx) * sk, WORDMARK.height * sk, N.x * dpr, N.y * dpr, N.w * dpr, N.h * dpr);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      step(now);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      root.style.setProperty('--story-handoff', v > 0.001 ? '1' : '0');
      if (v <= 0.001) {
        // Keep the hero logo's position fresh so the hand-over back to it is exact.
        if (page === 0) measure();
        return;
      }
      if (!shapes.length || deck.getBoundingClientRect().bottom < 0) return;

      const { cx, cy, B } = box();
      // The gentle float fades in as the N settles, so there is no jump between phases.
      const floatY = reduced ? 0 : Math.sin(now / 1700) * 3 * ease(clamp((v - 0.4) / 0.3));
      if (v < 0.6) {
        // Overlapping phases make the logo's path one continuous motion in both directions.
        drawLogo(clamp(v / 0.34), clamp((v - 0.22) / 0.38), cx, cy + floatY, B);
        return;
      }
      halo(cx, cy + floatY, B, 1);
      if (v < 1) {
        const f = (v - 0.6) / 0.4;
        const fade = 1 - clamp(f * 3);
        if (fade > 0) {
          const n = nRect(cx, cy + floatY, B);
          const fit = nFit();
          const sk = sourceScale(img);
          ctx.globalAlpha = fade;
          ctx.drawImage(img, fit.sx * sk, 0, fit.sw * sk, fit.sh * sk, n.x * dpr, n.y * dpr, n.w * dpr, n.h * dpr);
          ctx.globalAlpha = 1;
        }
        drawParticles(shapes[0], shapes[1], f, cx, cy + floatY, B, clamp(f * 3), now);
        return;
      }
      const i = Math.min(Math.floor(v), OBJECTS.length);
      drawParticles(shapes[i], shapes[Math.min(i + 1, OBJECTS.length)], i >= OBJECTS.length ? 0 : v - i, cx, cy + floatY, B, 1, now);
    };

    /* ---------- Input: one page per gesture ---------- */
    let locked = false;
    let lockTimer = 0;
    let lastWheel = 0;
    let gestureUsed = false;
    const busy = () => root.classList.contains('intro-playing') || root.classList.contains('menu-open');
    const transitioning = () => Math.abs(v - page) > 0.001;

    const go = (next: number) => {
      if (next === page || next < 0 || next > LAST) return;
      setPage(next);
      locked = true;
      gestureUsed = true;
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(() => (locked = false), reduced ? 250 : 900);
    };

    /** Page change for a scroll in `dir`, or null to let the document scroll (footer). */
    const target = (dir: 1 | -1): number | null => {
      if (busy() || window.scrollY > 2) return null;
      if (dir > 0) return page < LAST ? page + 1 : null;
      return page > 0 ? page - 1 : null;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const now = performance.now();
      if (now - lastWheel > 200) gestureUsed = false;
      lastWheel = now;
      // Keep a gesture inside the deck until its transition has finished.
      // In particular, the last page becomes active before its animation ends.
      if (!busy() && window.scrollY <= 2 && (transitioning() || (e.deltaY > 0 && page === LAST && (locked || gestureUsed)))) {
        e.preventDefault();
        return;
      }
      const next = target(e.deltaY > 0 ? 1 : -1);
      if (next === null) return;
      e.preventDefault();
      if (!locked && !gestureUsed && Math.abs(e.deltaY) >= 2) go(next);
    };

    let touchY = 0;
    let touchUsed = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchUsed = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 8) return;
      if (!busy() && window.scrollY <= 2 && (transitioning() || (dy > 0 && page === LAST && (locked || touchUsed)))) {
        e.preventDefault();
        return;
      }
      const next = target(dy > 0 ? 1 : -1);
      if (next === null) return;
      e.preventDefault();
      if (!locked && !touchUsed && Math.abs(dy) > 30) {
        touchUsed = true;
        go(next);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && t?.tagName !== 'BUTTON');
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!down && !up) return;
      if (!busy() && window.scrollY <= 2 && transitioning()) {
        e.preventDefault();
        return;
      }
      const next = target(down ? 1 : -1);
      if (next === null) return;
      e.preventDefault();
      if (!locked) go(next);
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-deck-go]');
      if (!el || !deck.contains(el)) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      go(Number(el.dataset.deckGo));
    };

    const onHash = () => {
      const i = HASHES.indexOf(window.location.hash);
      if (i > 0 && i !== page) {
        window.scrollTo({ top: 0 });
        go(i);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced || event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const clearPointer = () => { pointer.active = false; };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) clearPointer();
    };

    /* ---------- Start ---------- */
    root.classList.add('deck-ready');
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const initial = Math.max(0, HASHES.indexOf(window.location.hash));
    if (initial > 0) {
      // Opened from /#about etc.: show that page instead of the browser's anchor jump.
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
    measure();
    setPage(initial, false);
    window.addEventListener('resize', measure);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', clearPointer);
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    deck.addEventListener('click', onClick);

    const ready = () => {
      shapes = [sampleShape(drawN(img), count), ...OBJECTS.map((o) => sampleShape(o.draw, count))];
    };
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener('load', ready, { once: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(lockTimer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', clearPointer);
      document.removeEventListener('pointerout', onPointerOut);
      deck.removeEventListener('click', onClick);
      root.classList.remove('deck-ready');
      history.scrollRestoration = restoration;
      root.style.removeProperty('--story-handoff');
    };
  }, []);

  return <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />;
}
