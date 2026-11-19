'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CountUp } from '@/components/prize/CountUp';
import { Confetti } from './Confetti';
import Image from 'next/image';
import { formatRupees } from '@/data/prizes';

type Entry = {
  rank: string;
  amount: number;
  project?: { title: string; college: string; category: string; teamSize: number; average: number };
};

/** Reveal order: 2nd runner-up (1) → 1st runner-up (2) → winner (3) → special awards (4). */
const DELAYS = [700, 1500, 1900, 1300];
const CAPTIONS = ['Revealing the results…', 'Second runner-up', 'First runner-up', 'And the winner is…', 'Special recognition'];

export function ResultsShowcase({
  champion,
  runnersUp,
  specials,
  maxTotal,
}: {
  champion: Entry;
  runnersUp: Entry[];
  specials: Entry[];
  maxTotal: number;
}) {
  const [stage, setStage] = useState(0);
  const [runId, setRunId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const winnerRef = useRef<HTMLElement>(null);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(4);
      return;
    }
    setStage(0);
    setRunId((r) => r + 1);
    let at = 0;
    DELAYS.forEach((d, i) => {
      at += d;
      timers.current.push(setTimeout(() => setStage(i + 1), at));
    });
  }, []);

  useEffect(() => {
    queueMicrotask(play);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, [play]);

  // Bring the winner into view as it lands, if it is off-screen.
  useEffect(() => {
    if (stage !== 3) return;
    const el = winnerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.55 || r.bottom < 0) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [stage]);

  const done = stage >= 4;

  return (
    <div className="p2-reveal" data-stage={stage}>
      <noscript>
        <style>{'.p2-reveal [data-step]{opacity:1!important;transform:none!important;filter:none!important}'}</style>
      </noscript>

      <div className="p2-reveal-bar" aria-live="polite">
        <span className="p2-reveal-caption">
          <span className={`p2-reveal-dot${done ? ' is-done' : ''}`} aria-hidden="true" />
          {done ? 'All results announced' : CAPTIONS[stage]}
        </span>
        <span className="p2-reveal-steps" aria-hidden="true">
          {[1, 2, 3, 4].map((s) => (
            <i key={s} className={stage >= s ? 'is-on' : undefined} />
          ))}
        </span>
        <button type="button" className="text-link" onClick={play} disabled={!done}>
          Replay reveal <span aria-hidden="true">↻</span>
        </button>
      </div>

      <ol className="p2-ranks">
        {[...runnersUp].reverse().map((r, i) => (
          <li key={r.rank} data-step={i + 1}>
            <span className="p2-rank-no">{String(runnersUp.length + 1 - i).padStart(2, '0')}</span>
            <div>
              <p className="p2-label">{r.rank}</p>
              <h3>{r.project?.title ?? 'To be announced'}</h3>
              {r.project && (
                <p className="muted">
                  {r.project.college} · {r.project.category}
                </p>
              )}
            </div>
            <span className="p2-rank-amount">{formatRupees(r.amount)}</span>
          </li>
        ))}
      </ol>

      {champion.project && (
        <article className="p2-winner" data-step="3" ref={winnerRef}>
          <Confetti key={runId} fire={stage >= 3} />
          <div className="p2-winner-art p2-brand-art" aria-hidden="true">
            <Image src="/bg_1.png" alt="" fill sizes="(max-width: 860px) 100vw, 45vw" className="p2-brand-bg" />
            <svg className="p2-ribbon" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
              <defs>
                <path id="p2-ribbon-path" d="M -40 470 C 140 380, 300 560, 640 410" />
              </defs>
              <text>
                <textPath href="#p2-ribbon-path" startOffset="0%">
                  {'CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · CSI · '.repeat(2)}
                  <animate attributeName="startOffset" from="0%" to="-50%" dur="24s" repeatCount="indefinite" />
                </textPath>
              </text>
            </svg>
            <span className="p2-brand-no">01</span>
            <span className="p2-brand-tag">Winner · NEXUS 2026</span>
          </div>
          <div className="p2-winner-body">
            <p className="p2-label">
              {champion.rank} <span aria-hidden="true">·</span> {champion.project.category}
            </p>
            <h3>{champion.project.title}</h3>
            <p className="muted">
              {champion.project.college} · Team of {champion.project.teamSize}
            </p>
            <dl className="p2-winner-facts">
              <div>
                <dt>Prize</dt>
                <dd className="p2-winner-amount">
                  {stage >= 3 ? <CountUp key={`c${stage >= 3}`} value={champion.amount} /> : formatRupees(0)}
                </dd>
              </div>
              <div>
                <dt>Jury average</dt>
                <dd>
                  {champion.project.average.toFixed(1)}
                  <small> / {maxTotal}</small>
                </dd>
              </div>
            </dl>
          </div>
        </article>
      )}


      <div className="p2-specials" data-step="4">
        <p className="eyebrow">Special recognition</p>
        <ul>
          {specials.map((s) => (
            <li key={s.rank} className="expo-track-card">
              <div className="expo-track-card-top">
                <span>{s.rank.toUpperCase()}</span>
                <span>{formatRupees(s.amount)}</span>
              </div>
              <h3>{s.project?.title ?? 'To be announced'}</h3>
              {s.project && (
                <p>
                  {s.project.college} · {s.project.category}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
