'use client';

import { useEffect, useRef } from 'react';

/** A decorative pointer accent; the native cursor remains available. */
export function CursorGlow() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let x = 0;
    let y = 0;

    const hide = () => cursor.classList.remove('is-visible', 'is-interactive', 'is-pressed');
    const move = (event: PointerEvent) => {
      if (!preference.matches || event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      cursor.classList.add('is-visible');
      const target = event.target instanceof Element ? event.target : null;
      cursor.classList.toggle('is-interactive', Boolean(target?.closest('a, button, [role="button"], input, select, textarea')));
      if (!frame) frame = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frame = 0;
      });
    };
    const press = (event: PointerEvent) => { if (event.pointerType === 'mouse') cursor.classList.add('is-pressed'); };
    const release = () => cursor.classList.remove('is-pressed');
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    const preferenceChanged = () => { if (!preference.matches) hide(); };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('blur', hide);
    preference.addEventListener('change', preferenceChanged);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      document.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', hide);
      preference.removeEventListener('change', preferenceChanged);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={cursorRef} className="cursor-glow" aria-hidden="true"><span /></div>;
}
