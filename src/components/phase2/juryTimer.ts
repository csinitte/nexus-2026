'use client';

import { useEffect, useRef, useState } from 'react';
import { slotOf } from './jury-types';
import { elapsedOf, type PanelSession } from './juryStore';

export type Phase = 'idle' | 'ready' | 'present' | 'qa' | 'over';

export const PHASE_LABEL: Record<Phase, string> = {
  idle: 'No team selected',
  ready: 'Ready to start',
  present: 'Presentation',
  qa: 'Q&A',
  over: 'Time up',
};

export function phaseOf(s: PanelSession, elapsed: number): Phase {
  if (!s.teamId) return 'idle';
  if (elapsed <= 0 && !s.running) return 'ready';
  const slot = slotOf(s);
  if (elapsed < slot.presentSeconds) return 'present';
  if (elapsed < slot.totalSeconds) return 'qa';
  return 'over';
}

/** Seconds left in the current phase (negative once over time). */
export function remainingOf(phase: Phase, elapsed: number, slot = slotOf()) {
  if (phase === 'present' || phase === 'ready') return slot.presentSeconds - elapsed;
  if (phase === 'qa' || phase === 'over') return slot.totalSeconds - elapsed;
  return 0;
}

export function clock(sec: number) {
  const neg = sec < 0;
  const s = Math.abs(Math.round(sec));
  return `${neg ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Re-renders every `ms` so timers tick. */
export function useNow(ms = 250) {
  // Starts at 0 (no clock read during prerender), then ticks on the client.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, ms);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [ms]);
  return now;
}

let audio: AudioContext | null = null;

/** Short tone(s) via Web Audio — no sound files needed. */
export function beep(times = 2) {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    for (let i = 0; i < times; i++) {
      const t = audio.currentTime + i * 0.35;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  } catch {
    /* audio unavailable */
  }
}

/** Unlocks audio on the first click so later beeps can play. */
export function unlockAudio() {
  beep(0);
}

/**
 * Watches a panel's timer and fires `onChange` when it crosses from
 * presentation to Q&A, and from Q&A to time up. Beeps on each.
 */
export function usePhaseAlerts(session: PanelSession, onChange: (to: Phase) => void) {
  const now = useNow(250);
  const phase = phaseOf(session, elapsedOf(session, now));
  const prev = useRef<{ team: string | null; phase: Phase }>({ team: session.teamId, phase });
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    const p = prev.current;
    if (p.team === session.teamId && p.phase !== phase && (phase === 'qa' || phase === 'over')) {
      beep(phase === 'over' ? 3 : 2);
      cb.current(phase);
    }
    prev.current = { team: session.teamId, phase };
  }, [phase, session.teamId]);
  return { now, phase, elapsed: elapsedOf(session, now) };
}
