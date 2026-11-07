'use client';

import { useEffect, useRef, useState } from 'react';
import { CountUp } from './CountUp';
import {
  PRIZE_TOTAL,
  PRIZE_PARTS,
} from '@/data/prizes';

export function PrizePool({ className }: { className?: string }) {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafs = useRef<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    let active = true;
    queueMicrotask(() => { if (active) setReducedMotion(mq.matches); });
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => { active = false; mq.removeEventListener('change', handler); };
  }, []);

  useEffect(() => {
    const handler = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const frames = rafs.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        const count = PRIZE_PARTS.length + 1;
        const delays = Array.from({ length: count }, (_, i) => i * 80);
        delays.forEach((delay, i) => {
          frames.push(
            requestAnimationFrame(() => {
              timers.push(setTimeout(() => {
                setVisibleCards((prev) => {
                  const next = [...prev];
                  next[i] = true;
                  return next;
                });
              }, delay));
            })
          );
        });
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      frames.forEach((id) => cancelAnimationFrame(id));
      timers.forEach(clearTimeout);
    };
  }, []);

  const cardVisible = (index: number) => visibleCards[index + 1] ?? false;

  const numMain = PRIZE_PARTS.filter((p) => !p.special).length;

  return (
    <section
      className={`prize-pool-section ${className || ''}`}
      ref={containerRef}
      aria-labelledby="prize-pool-heading"
    >
      {!reducedMotion && !tabHidden && (
        <div className="prize-particle-container" aria-hidden="true">
          <div className="prize-particles">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className={`prize-particle ${particleType(i)}`}
                style={particleStyle(i)}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}

      <div className="prize-pool-inner">
        <div className="prize-pool-header" data-reveal>
          <p className="prize-eyebrow">
            <span className="dot" aria-hidden="true" />
            Project Expo Awards
          </p>
          <h2 id="prize-pool-heading" className="prize-heading">
            The Rewards
          </h2>
          <p className="prize-subheading">Big ideas deserve recognition.</p>
          <div className="prize-total">
            <span className="prize-total-label">Total Prize Pool</span>
            <CountUp value={PRIZE_TOTAL} />
          </div>
        </div>

        <div className="prize-main-grid" data-reveal>
          {PRIZE_PARTS.filter((p) => !p.special).map((part, idx) => (
            <article
              key={part.rank}
              className={`prize-card${part.rank === 'Winner' ? ' prize-card--winner' : ''} ${cardVisible(idx) ? 'prize-card--visible' : ''}`}
              style={{
                opacity: cardVisible(idx) ? 1 : 0,
                transform: cardVisible(idx) ? 'translateY(0)' : 'translateY(30px)',
              }}
            >
              <span className="prize-card-icon" aria-hidden="true" style={{ color: 'var(--accent)' }}>
                {part.icon}
              </span>
              <strong className="prize-card-rank">{part.rank}</strong>
              <CountUp value={part.amount} />
            </article>
          ))}
        </div>

        <div className="prize-special-grid" data-reveal>
          <p className="prize-special-label">Special Recognition Awards</p>
          <div className="prize-special-cards">
            {PRIZE_PARTS.filter((p) => p.special).map((part, idx) => (
              <article
                key={part.rank}
                className={`prize-card prize-card--special ${cardVisible(numMain + idx) ? 'prize-card--visible' : ''}`}
                style={{
                  opacity: cardVisible(numMain + idx) ? 1 : 0,
                  transform: cardVisible(numMain + idx) ? 'translateY(0)' : 'translateY(30px)',
                }}
              >
                <span className="prize-card-icon" aria-hidden="true" style={{ color: 'var(--accent)' }}>
                  {part.icon}
                </span>
                <strong className="prize-card-rank">{part.rank}</strong>
                <CountUp value={part.amount} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function particleType(i: number): string {
  const types = ['prize-coin', 'prize-rupee', 'prize-sparkle', 'prize-trophy'];
  return types[i % types.length];
}

function particleStyle(i: number): React.CSSProperties {
  return {
    left: `${(i * 77) % 100}%`,
    top: `${(i * 53) % 100}%`,
    opacity: '0.15',
    animationDelay: `${i * 0.8}s`,
    fontSize: `${20 + (i % 3) * 8}px`,
  };
}