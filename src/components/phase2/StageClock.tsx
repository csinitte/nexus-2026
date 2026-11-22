import { SLOT, SLOT_TOTAL } from './jury-types';
import { PHASE_LABEL, clock, remainingOf, type Phase } from './juryTimer';

/**
 * Circular stage clock. The ring is the whole 10-minute slot: the first half
 * (green) is the presentation, the second half (yellow) is Q&A. A glowing
 * marker sweeps around as time passes.
 */
export function StageClock({ phase, elapsed, size = 300, label = true }: { phase: Phase; elapsed: number; size?: number; label?: boolean }) {
  const r = 46;
  const C = 2 * Math.PI * r;
  const split = SLOT.presentSeconds / SLOT_TOTAL;
  const p = Math.min(1, Math.max(0, elapsed / SLOT_TOTAL));
  const angle = p * 360 - 90;
  const tipX = 50 + r * Math.cos((angle * Math.PI) / 180);
  const tipY = 50 + r * Math.sin((angle * Math.PI) / 180);
  const presentDone = Math.min(p, split);
  const qaDone = Math.max(0, p - split);

  return (
    <div className={`p2-stage is-${phase}`} style={{ width: size, height: size }} role="timer" aria-label={`${PHASE_LABEL[phase]}, ${clock(remainingOf(phase, elapsed))}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {/* minute ticks */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
          const big = i % 6 === 0;
          const r1 = big ? 40.5 : 41.8;
          return (
            <line
              key={i}
              x1={50 + r1 * Math.cos(a)}
              y1={50 + r1 * Math.sin(a)}
              x2={50 + 43 * Math.cos(a)}
              y2={50 + 43 * Math.sin(a)}
              className={i / 60 < p ? 'tick is-past' : 'tick'}
              strokeWidth={big ? 0.7 : 0.35}
            />
          );
        })}
        {/* the two halves, dim */}
        <circle cx="50" cy="50" r={r} className="seg seg-present" strokeDasharray={`${C * split} ${C}`} transform="rotate(-90 50 50)" />
        <circle cx="50" cy="50" r={r} className="seg seg-qa" strokeDasharray={`${C * (1 - split)} ${C}`} strokeDashoffset={-C * split} transform="rotate(-90 50 50)" />
        {/* elapsed */}
        <circle cx="50" cy="50" r={r} className="fill fill-present" strokeDasharray={`${C * presentDone} ${C}`} transform="rotate(-90 50 50)" />
        {qaDone > 0 && <circle cx="50" cy="50" r={r} className="fill fill-qa" strokeDasharray={`${C * qaDone} ${C}`} strokeDashoffset={-C * split} transform="rotate(-90 50 50)" />}
        {/* half-way marker */}
        <line x1="50" y1={50 + r - 4} x2="50" y2={50 + r + 4} className="mark" />
        {/* sweeping tip */}
        {phase !== 'idle' && <circle cx={tipX} cy={tipY} r="2.4" className="tip" />}
      </svg>
      <div className="p2-stage-center">
        {label && <span className="p2-stage-phase">{PHASE_LABEL[phase]}</span>}
        <strong>{clock(remainingOf(phase, elapsed))}</strong>
        {label && <span className="p2-stage-sub">{phase === 'qa' ? 'Q&A left' : phase === 'over' ? 'over time' : 'presentation left'}</span>}
      </div>
    </div>
  );
}
