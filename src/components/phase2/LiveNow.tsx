'use client';

import { useEffect, useRef, useState } from 'react';

type Session = { start: string; end: string; iso: string; title: string };

const toMin = (t: string) => {
  const [hm, ap] = t.split(' ');
  const [h, m] = hm.split(':').map(Number);
  return ((h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The day's programme with live state: past sessions dim, the current one is
 * lit with a progress line, and a countdown runs to the next session.
 * Preview: the clock starts at a fixed event-day time (`startAt`).
 */
export function LiveNow({ sessions, startAt }: { sessions: readonly Session[]; startAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === heroRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function present() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void heroRef.current?.requestFullscreen?.();
  }

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const clock = toMin(startAt) * 60 + elapsed;
  const nowIndex = sessions.findIndex((s) => clock >= toMin(s.start) * 60 && clock < toMin(s.end) * 60);
  const now = sessions[nowIndex];
  const next = sessions[nowIndex + 1];
  const left = next ? Math.max(0, toMin(next.start) * 60 - clock) : 0;
  const progress = now ? (clock - toMin(now.start) * 60) / ((toMin(now.end) - toMin(now.start)) * 60) : 0;

  return (
    <>
      <section className="p2-onair" ref={heroRef} aria-label="On now">
        <div className="p2-onair-now">
          <p className="p2-onair-label">
            <span className="p2-live-dot" aria-hidden="true" /> On now
            <span className="p2-onair-time">
              {now ? `${now.start} – ${now.end}` : ''}
            </span>
          </p>
          <h2>{now?.title ?? 'Between sessions'}</h2>
          {now && (
            <div className="p2-onair-progress">
              <span className="p2-onair-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
              </span>
              <span className="p2-meta">
                {Math.round(progress * 100)}% through · {Math.max(0, Math.ceil((toMin(now.end) * 60 - clock) / 60))} min left
              </span>
            </div>
          )}
        </div>
        <div className="p2-onair-next">
          <p className="p2-meta">Up next · {next?.start ?? '—'}</p>
          <p className="p2-onair-next-title">{next?.title ?? 'That’s a wrap'}</p>
          <div className="p2-flip" role="timer" aria-label={`Starts in ${Math.floor(left / 60)} minutes`}>
            {[
              [pad(Math.floor(left / 3600)), 'hrs'],
              [pad(Math.floor((left % 3600) / 60)), 'min'],
              [pad(left % 60), 'sec'],
            ].map(([v, unit]) => (
              <span key={unit} className="p2-flip-cell">
                <b key={v}>{v}</b>
                <small>{unit}</small>
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="p2-present" onClick={present}>
          {isFull ? 'Exit screen mode' : 'Present on screen'} <span aria-hidden="true">{isFull ? '×' : '⤢'}</span>
        </button>
      </section>

      <ol className="timeline p2-live-timeline" aria-label="Today’s programme">
        {sessions.map((s, i) => {
          const state = i < nowIndex ? 'is-past' : i === nowIndex ? 'is-feature is-now' : '';
          return (
            <li key={s.iso} className={state || undefined}>
              <span className="timeline-node" aria-hidden="true" />
              <time>
                {s.start}
                <span> – {s.end}</span>
              </time>
              <div className="timeline-body">
                <span className="timeline-index">
                  {String(i + 1).padStart(2, '0')}
                  {i === nowIndex && <b className="p2-live-tag">Live</b>}
                  {i < nowIndex && <b className="p2-done-tag">Done</b>}
                </span>
                <h2>{s.title}</h2>
                {i === nowIndex && (
                  <span className="p2-session-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
