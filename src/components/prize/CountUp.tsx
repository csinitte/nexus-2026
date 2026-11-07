'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Tracks which DOM elements have already played their count-up animation,
 * so React Strict Mode double-mount doesn't re-trigger it.
 */
const animatedElements = new WeakSet<HTMLElement>();

/**
 * <CountUp value={n} />
 *
 * Renders the final formatted value in the initial HTML so it's correct
 * with JS disabled. When the element enters the viewport, it counts up
 * from 0 to the target over ~1.5s with an ease-out curve, then locks on
 * the exact target value.
 *
 * Fallbacks:
 *  - No IntersectionObserver → show final value immediately
 *  - prefers-reduced-motion → show final value immediately
 *  - Already visible on load → show final value immediately
 *
 * Strict Mode safe: plays only once per page view per element.
 */
export function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);

  const formatted = useCallback(
    (n: number) => `₹${Math.floor(n).toLocaleString('en-IN')}`,
    []
  );

  const startCountUp = useCallback(() => {
    setAnimating(true);
    const start = performance.now();
    const duration = 1500; // ~1.5s
    const target = value;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const current = eased * target;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
        setAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [value]);

  // Start count-up when the element enters the viewport
  useEffect(() => {
    const el = ref.current;
    if (!el || animatedElements.has(el)) return;

    const prefersReduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fallbacks: show final value immediately
    if (!('IntersectionObserver' in window) || prefersReduced) {
      animatedElements.add(el);
      return;
    }

    // Check if already visible on load
    const rect = el.getBoundingClientRect();
    const alreadyVisible =
      rect.top < window.innerHeight && rect.bottom > 0;

    if (alreadyVisible) {
      animatedElements.add(el);
      return;
    }

    // Otherwise: observe and count up on entry
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || animatedElements.has(el)) return;
        animatedElements.add(el);
        startCountUp();
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, startCountUp]);

  // Cancel animation on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <span
      ref={ref}
      className="countup"
      style={{
        minWidth: `${value.toLocaleString('en-IN').length}ch`,
        fontVariantNumeric: 'tabular-nums',
      }}
      data-value={value}
      data-animating={animating}
    >
      {formatted(displayValue)}
    </span>
  );
}
