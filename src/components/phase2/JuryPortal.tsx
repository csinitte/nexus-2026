'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { PreviewBanner } from './PreviewBanner';
import { Ring } from './Fx';
import { ScoreRadar } from './ScoreRadar';
import { WaveField } from './WaveField';
import { Icon } from './Icons';
import { CRITERIA, MAX_PER_CRITERION, MAX_TOTAL, PANEL_NAMES, SLOT, SLOT_TOTAL, TEAMS, blankScores, total, type Juror, type Scores, type Team } from './mock';
import { jury, useJury } from './juryStore';
import { PHASE_LABEL, clock, remainingOf, unlockAudio, usePhaseAlerts, type Phase } from './juryTimer';

const pad = (n: number) => String(n).padStart(2, '0');
const SESSION_KEY = 'nexus-jury-login';

export function JuryPortal() {
  const st = useJury();
  const [jurorId, setJurorId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Stay signed in for this tab.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) queueMicrotask(() => setJurorId(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const juror = st.jurors.find((j) => j.id === jurorId) ?? null;

  function signIn(j: Juror) {
    unlockAudio();
    try {
      sessionStorage.setItem(SESSION_KEY, j.id);
    } catch {
      /* ignore */
    }
    setJurorId(j.id);
  }
  function signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setJurorId(null);
    setOpenId(null);
  }

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Jury portal{juror ? ` · ${juror.name}` : ''} {juror && <em>{PANEL_NAMES[juror.panel]}</em>}
        </span>
        {juror && (
          <button type="button" className="button outline small" onClick={signOut}>
            Sign out
          </button>
        )}
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        <PreviewBanner note={juror ? 'Demo data — the timer is controlled from /admin/jury' : 'Demo logins are listed in /admin/jury'} />
        {juror ? <JurorHome juror={juror} openId={openId} setOpenId={setOpenId} /> : <SignIn onSignedIn={signIn} />}
      </main>
    </div>
  );
}

/* ---------- Sign in ---------- */

function SignIn({ onSignedIn }: { onSignedIn: (j: Juror) => void }) {
  const st = useJury();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const j = st.jurors.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!j || j.password !== password.trim()) return setError('Username or password is wrong. Check the login the organisers shared with you.');
    onSignedIn(j);
  }

  return (
    <>
      <section className="p2-art-hero p2-login-hero">
        <div className="p2-art-hero-copy">
          <p className="p2-art-kicker">Student Project Expo · Jury</p>
          <h1>
            Jury <em>portal.</em>
          </h1>
          <p>Score your panel’s teams from your phone or laptop. The organisers run the timer — you’ll hear a beep when each part ends.</p>
        </div>
        <WaveField />
      </section>

      <div className="p2-access">
        <form className="p2-access-fields" onSubmit={submit}>
          <div className="field wide">
            <label htmlFor="jury-user">
              <Icon name="user" size={15} /> Username
            </label>
            <input id="jury-user" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field wide">
            <label htmlFor="jury-password">
              <Icon name="lock" size={15} /> Password
            </label>
            <input id="jury-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button">
            Sign in <span aria-hidden="true">↗</span>
          </button>
        </form>

        <ol className="p2-how" aria-label="How judging works">
          <li>
            <span className="p2-how-icon"><Icon name="lock" size={26} /></span>
            <div>
              <h3>Sign in</h3>
              <p>Use the username and password the organisers shared with you.</p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon"><Icon name="timer" size={26} /></span>
            <div>
              <h3>Watch the timer</h3>
              <p>
                Each team: {SLOT.presentSeconds / 60} min presentation, then {SLOT.qaSeconds / 60} min Q&amp;A. A beep marks each switch.
              </p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon"><Icon name="check" size={26} /></span>
            <div>
              <h3>Score & comment</h3>
              <p>Rate {CRITERIA.length} criteria out of {MAX_PER_CRITERION} and add a short remark for the organisers.</p>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
}

/* ---------- Signed in ---------- */

function JurorHome({ juror, openId, setOpenId }: { juror: Juror; openId: string | null; setOpenId: (id: string | null) => void }) {
  const st = useJury();
  const session = st.session[juror.panel];
  const [toast, setToast] = useState<{ phase: Phase; team: string } | null>(null);
  const { phase, elapsed } = usePhaseAlerts(session, (to) => {
    setToast({ phase: to, team: session.teamId ?? '' });
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const order = st.order[juror.panel];
  const mine = order.map((id) => TEAMS.find((t) => t.id === id)!);
  const done = mine.filter((t) => st.evals[t.id]?.[juror.id]).length;
  const current = session.teamId ? TEAMS.find((t) => t.id === session.teamId) ?? null : null;
  const open = openId ? mine.find((t) => t.id === openId) ?? null : null;

  return (
    <>
      {toast && (
        <div className={`p2-toast-big is-${toast.phase}`} role="alert">
          <span className="p2-bell" aria-hidden="true">
            <Icon name="bell" size={30} />
          </span>
          <div>
            <strong>{toast.phase === 'qa' ? 'Presentation time is over' : 'Q&A time is over'}</strong>
            <p>{toast.phase === 'qa' ? `Q&A has started for ${TEAMS.find((t) => t.id === toast.team)?.title ?? 'this team'} — 5 minutes.` : 'Please finish and submit your score.'}</p>
          </div>
          <button type="button" className="p2-copy" onClick={() => setToast(null)}>
            OK
          </button>
        </div>
      )}

      {current && <LiveStrip compact={open?.id === current.id} team={current} phase={phase} elapsed={elapsed} running={session.running} onScore={() => setOpenId(current.id)} scored={!!st.evals[current.id]?.[juror.id]} showScore={open?.id !== current.id} />}

      {open ? (
        <ScoreSheet
          key={open.id}
          live={session.teamId === open.id ? { phase, elapsed } : null}
          team={open}
          index={order.indexOf(open.id)}
          initial={st.evals[open.id]?.[juror.id]}
          onBack={() => setOpenId(null)}
          onSubmit={(scores, comment) => {
            jury.submitEval(open.id, juror.id, scores, comment);
            setOpenId(null);
          }}
        />
      ) : (
        <>
          <div className="schedule-timeline-intro p2-art-hero p2-art-hero-sm">
            <WaveField density={0.8} />
            <div className="p2-art-hero-copy">
              <p className="p2-art-kicker">
                {juror.name} · {PANEL_NAMES[juror.panel]}
              </p>
              <h2>
                Your <em>teams.</em>
              </h2>
            </div>
            <div className="p2-queue-progress">
              <Ring value={done} max={mine.length || 1} size={64} stroke={5}>
                {done}/{mine.length}
              </Ring>
              <p>
                <strong>{pad(done)}</strong> of {pad(mine.length)} scored
              </p>
            </div>
          </div>
          {mine.length === 0 ? (
            <p className="empty">Teams haven’t been assigned to your panel yet. This page updates by itself once the organisers do it.</p>
          ) : (
            <ol className="p2-queue">
              {mine.map((t, i) => {
                const ev = st.evals[t.id]?.[juror.id];
                const live = session.teamId === t.id;
                const upNext = !!session.teamId && order.indexOf(session.teamId) + 1 === i;
                return (
                  <li key={t.id} className={`${ev ? 'is-done' : ''}${live ? ' is-live' : ''}`.trim() || undefined}>
                    <span className="p2-queue-table">
                      <small>{live ? 'Now' : 'Order'}</small>
                      {pad(i + 1)}
                    </span>
                    <div className="p2-queue-body">
                      <p className="p2-label">
                        {t.code} <span>· {t.category}</span>
                      </p>
                      <h3>{t.title}</h3>
                      <p className="muted">
                        {t.college} · {t.members.length} members
                      </p>
                    </div>
                    <div className="p2-queue-action">
                      {ev ? (
                        <Ring value={total(ev.scores)} max={MAX_TOTAL} size={54}>
                          {total(ev.scores)}
                        </Ring>
                      ) : live ? (
                        <span className="p2-phase is-present">
                          <i aria-hidden="true" />
                          Presenting
                        </span>
                      ) : upNext ? (
                        <span className="p2-phase">Up next</span>
                      ) : (
                        <span className="p2-meta">Not scored</span>
                      )}
                      <button type="button" className={ev ? 'button outline small' : 'button small'} onClick={() => setOpenId(t.id)}>
                        {ev ? 'Edit' : 'Score'} <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </>
  );
}

function LiveStrip({
  compact,
  team,
  phase,
  elapsed,
  running,
  onScore,
  scored,
  showScore,
}: {
  compact: boolean;
  team: Team;
  phase: Phase;
  elapsed: number;
  running: boolean;
  onScore: () => void;
  scored: boolean;
  showScore: boolean;
}) {
  const pct = Math.min(100, (elapsed / SLOT_TOTAL) * 100);
  return (
    <section className={`p2-livestrip is-${phase}${compact ? ' is-sheet' : ''}`} aria-label="Now presenting">
      <div>
        <p className="p2-label">
          {running ? <i className="p2-live-dot" aria-hidden="true" /> : null} Now presenting · {PHASE_LABEL[phase]}
          {!running && phase !== 'ready' && phase !== 'over' ? ' (paused)' : ''}
        </p>
        <h2>{team.title}</h2>
      </div>
      <div className="p2-livestrip-clock">
        <span role="timer">{clock(remainingOf(phase, elapsed))}</span>
        <div className="p2-split-bar" aria-hidden="true">
          <span className="p2-split-fill" style={{ width: `${pct}%` }} />
          <i style={{ left: '50%' }} />
        </div>
      </div>
      {showScore && (
        <button type="button" className={scored ? 'button outline small' : 'button small'} onClick={onScore}>
          {scored ? 'Edit score' : 'Score this team'} →
        </button>
      )}
    </section>
  );
}

/* ---------- Score sheet ---------- */

function ScoreSheet({
  live,
  team,
  index,
  initial,
  onBack,
  onSubmit,
}: {
  live: { phase: Phase; elapsed: number } | null;
  team: Team;
  index: number;
  initial?: { scores: Scores; comment: string };
  onBack: () => void;
  onSubmit: (s: Scores, comment: string) => void;
}) {
  const [s, setS] = useState<Scores>(initial?.scores ?? blankScores());
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState('');
  const sum = total(s);
  const filled = CRITERIA.filter((c) => s[c.id] > 0).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = CRITERIA.filter((c) => s[c.id] === 0);
    if (missing.length) return setError(`Still to score: ${missing.map((c) => c.label).join(', ')}.`);
    onSubmit(s, comment.trim());
  }

  return (
    <form className="p2-sheet" onSubmit={submit}>
      <button type="button" className="text-link p2-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All teams
      </button>

      <header className="p2-sheet-head">
        <p className="p2-label">
          Team {pad(index + 1)} <span>· {team.code} · {team.category}</span>
        </p>
        <h1>{team.title}</h1>
        <p className="muted">
          {team.college} · {team.members.join(', ')}
        </p>
      </header>

      <dl className="detail-strip p2-sheet-strip">
        <div>
          <dt>Criteria scored</dt>
          <dd>
            {filled}
            <small> / {CRITERIA.length}</small>
          </dd>
          <span className="p2-pips" aria-hidden="true">
            {CRITERIA.map((c) => (
              <i key={c.id} className={s[c.id] ? 'is-on' : undefined} />
            ))}
          </span>
        </div>
        <div className="p2-radar-cell">
          <dt>Score shape</dt>
          <ScoreRadar scores={s} size={190} />
        </div>
        <div>
          <dt>Total</dt>
          <div className="p2-sum-wrap">
            <Ring value={sum} max={MAX_TOTAL} size={84} stroke={5}>
              {Math.round((sum / MAX_TOTAL) * 100)}%
            </Ring>
            <dd className="accent p2-sum" key={sum}>
              {sum}
              <small> / {MAX_TOTAL}</small>
            </dd>
          </div>
        </div>
      </dl>

      <ol className="p2-crit">
        {CRITERIA.map((c) => (
          <li key={c.id}>
            <div className="p2-crit-label" id={`c-${c.id}`}>
              <span className="p2-crit-icon">
                <Icon name={c.id} size={22} />
              </span>
              <div>
                <h3>{c.label}</h3>
                <p>{c.hint}</p>
              </div>
            </div>
            <div className="p2-segments" role="radiogroup" aria-labelledby={`c-${c.id}`}>
              {Array.from({ length: MAX_PER_CRITERION }, (_, k) => k + 1).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={s[c.id] === v}
                  aria-label={`${v} out of ${MAX_PER_CRITERION}`}
                  className={v <= s[c.id] ? 'is-filled' : undefined}
                  onClick={() => setS((all) => ({ ...all, [c.id]: v }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="field wide p2-remarks">
        <label htmlFor="remarks">Comment for the organisers</label>
        <textarea id="remarks" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What stood out, what was weak, anything for the final decision" />
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <div className="p2-sheet-bar">
        {live && (
          <span className={`p2-sheet-live is-${live.phase}`} role="timer">
            <i aria-hidden="true" />
            {PHASE_LABEL[live.phase]} <b>{clock(remainingOf(live.phase, live.elapsed))}</b>
          </span>
        )}
        <span className="p2-sheet-bar-total">
          <small>Total</small>
          {sum}
          <em>/{MAX_TOTAL}</em>
        </span>
        <button type="button" className="button outline" onClick={onBack}>
          Cancel
        </button>
        <button className="button">
          {initial ? 'Update score' : 'Submit score'} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
