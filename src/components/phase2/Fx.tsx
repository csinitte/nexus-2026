'use client';

import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from 0 to `value` when first shown. Keeps decimals if `decimals` is set. */
export function Num({ value, decimals = 0, duration = 1100 }: { value: number; decimals?: number; duration?: number }) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || played.current || reduced()) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || played.current) return;
      played.current = true;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setV(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setV(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {v.toFixed(decimals)}
    </span>
  );
}

/** Circular gauge with a glowing arc that draws in. */
export function Ring({ value, max, size = 64, stroke = 4, children }: { value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const pct = max ? Math.min(1, value / max) : 0;
  const [shown, setShown] = useState(reduced() ? pct : 0);
  useEffect(() => {
    if (reduced()) return;
    const t = setTimeout(() => setShown(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  const r = (size - stroke) / 2;
  return (
    <span className="p2-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="p2-ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="p2-ring-arc"
          pathLength={100}
          style={{ strokeDashoffset: 100 - shown * 100 }}
        />
      </svg>
      {children && <span className="p2-ring-label">{children}</span>}
    </span>
  );
}

/** Tab strip with a sliding, glowing indicator. */
export function SlideTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly (readonly [T, string])[];
  value: T;
  onChange: (t: T) => void;
  label: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value]);
  return (
    <div className="p2-slidetabs" role="tablist" aria-label={label} ref={wrap}>
      {tabs.map(([id, text], i) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-selected={value === id}
          aria-controls={`panel-${id}`}
          onClick={(e) => {
            onChange(id);
            e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
          }}
        >
          <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span> {text}
        </button>
      ))}
      <span className="p2-slidetabs-bar" style={{ transform: `translateX(${bar.left}px)`, width: bar.width }} aria-hidden="true" />
    </div>
  );
}
