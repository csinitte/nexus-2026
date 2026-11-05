'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IntroEngine, type BootState } from './engine';

const SEEN_KEY = 'nexus26-intro';
const ACCENT = '#8cea5a';

/**
 * Hides the overlay before first paint when the intro was already seen this
 * session (or `?intro=0`), so returning visitors never see a black flash.
 * `?intro=1` forces a replay. Injected into <head> to avoid touching React-owned nodes.
 */
const PRE_PAINT = `try{var q=location.search;if((sessionStorage.getItem('${SEEN_KEY}')==='seen'&&q.indexOf('intro=1')<0)||q.indexOf('intro=0')>-1){var s=document.createElement('style');s.textContent='.nx-intro{display:none!important}';document.head.appendChild(s)}}catch(e){}`;

type Phase = 'pending' | 'playing' | 'revealing' | 'done';

export function IntroGate() {
  const [phase, setPhase] = useState<Phase>('pending');
  const [boot, setBoot] = useState<BootState>({ typed: '', showBoot: true, cursorOn: true, cursorBlink: true, bootBroken: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bootRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<IntroEngine | null>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = null;
    try {
      sessionStorage.setItem(SEEN_KEY, 'seen');
    } catch {
      /* storage unavailable */
    }
    setPhase((p) => (p === 'done' ? p : 'revealing'));
    window.setTimeout(() => setPhase('done'), 1100);
  }, []);

  // Decide whether to play: once per session, never for reduced motion.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === 'seen';
    } catch {
      seen = true;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const force = params.get('intro') === '1';
    const skip = params.get('intro') === '0' || reduced || (seen && !force);
    queueMicrotask(() => setPhase(skip ? 'done' : 'playing'));
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !canvasRef.current) return;
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';
    const engine = new IntroEngine({
      canvas: canvasRef.current,
      getBootEl: () => bootRef.current,
      getCursorEl: () => cursorRef.current,
      accent: ACCENT,
      fontFamily,
      onState: (patch) => setBoot((b) => ({ ...b, ...patch })),
      onReveal: finish,
    });
    engineRef.current = engine;
    engine.start();
    skipRef.current?.focus({ preventScroll: true });
    document.documentElement.classList.add('intro-playing');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    document.addEventListener('keydown', onKey);
    return () => {
      engine.destroy();
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('intro-playing');
    };
  }, [phase, finish]);

  if (phase === 'done') return null;

  const broken = (bit: number) => (boot.bootBroken & (1 << bit) ? 0 : 1);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      <div className={`nx-intro${phase === 'revealing' ? ' is-revealing' : ''}`} role="presentation">
        <div className="nx-intro-boot" aria-hidden="true">
          {boot.showBoot && (
            <div className="nx-intro-prompt">
              <span className="nx-intro-measure">
                &gt; BOOT
                <span className="nx-intro-cursor-space" />
              </span>
              <span ref={bootRef} className="nx-intro-typed">
                <span style={{ opacity: broken(0) }}>&gt;</span>{' '}
                {'BOOT'.split('').map((ch, i) => (
                  <span key={i} style={{ opacity: broken(i + 1) }}>
                    {i < boot.typed.length ? ch : ''}
                  </span>
                ))}
                {boot.cursorOn && (
                  <span style={{ display: 'inline-block', opacity: broken(5) }}>
                    <span ref={cursorRef} className={`nx-intro-cursor${boot.cursorBlink ? ' is-blinking' : ''}`} />
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="nx-intro-canvas" aria-hidden="true" />
        <button ref={skipRef} type="button" className="nx-intro-skip" onClick={finish}>
          Skip intro <span aria-hidden="true">→</span>
        </button>
      </div>
    </>
  );
}
