'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { Ring } from './Fx';
import { ScoreRadar } from './ScoreRadar';
import { WaveField } from './WaveField';
import { Icon } from './Icons';
import {
  CRITERIA,
  MAX_PER_CRITERION,
  MAX_TOTAL,
  PANEL_NAMES,
  SLOT,
  slotOf,
  blankScores,
  criterionWeightedScore,
  totalWeightedScore,
  type Juror,
  type Scores,
  type Team,
} from './jury-types';
import { jury, signInJuror, signOutJuror, useJury, useJuryConnection } from './juryStore';
import { PHASE_LABEL, beep, clock, remainingOf, unlockAudio, usePhaseAlerts, type Phase } from './juryTimer';

const pad = (n: number) => String(n).padStart(2, '0');

export function JuryPortal() {
  const { state, status, error } = useJuryConnection('portal');
  const [openId, setOpenId] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState('');
  const juror = state.me;

  async function signOut() {
    try {
      await signOutJuror();
      setOpenId(null);
      setSignOutError('');
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    }
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
        {(error || signOutError) && <p className="form-alert" role="alert">{signOutError || error}</p>}
        {status === 'loading' ? (
          <p role="status">Checking your jury session…</p>
        ) : juror ? (
          <JurorHome juror={juror} openId={openId} setOpenId={setOpenId} />
        ) : (
          <SignIn />
        )}
      </main>
    </div>
  );
}

/* ---------- Sign in ---------- */

function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    unlockAudio();
    setBusy(true);
    setError('');
    try {
      await signInJuror(username, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="p2-art-hero p2-login-hero">
        <div className="p2-art-hero-copy">
          <p className="p2-art-kicker">Student Project Expo · Jury Portal</p>
          <h1>
            Jury <em>evaluation.</em>
          </h1>
          <p>
            Official NEXUS 2026 scoring portal. Enter numeric marks (0–10) across the 7 evaluation criteria.
            The stage volunteer runs the timer with acoustic alerts at 5:00 and 10:00.
          </p>
        </div>
        <WaveField />
      </section>

      <div className="p2-access">
        <form className="p2-access-fields" onSubmit={submit}>
          <div className="field wide">
            <label htmlFor="jury-user">
              <Icon name="user" size={15} /> Username
            </label>
            <input
              id="jury-user"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field wide">
            <label htmlFor="jury-password">
              <Icon name="lock" size={15} /> Password
            </label>
            <input
              id="jury-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Jury Portal'} <span aria-hidden="true">↗</span>
          </button>
        </form>

        <ol className="p2-how" aria-label="How judging works">
          <li>
            <span className="p2-how-icon">
              <Icon name="lock" size={26} />
            </span>
            <div>
              <h3>Sign in</h3>
              <p>Use the panel-assigned credentials provided by the organisers.</p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon">
              <Icon name="timer" size={26} />
            </span>
            <div>
              <h3>Live Stage Timer</h3>
              <p>
                Each team gets {SLOT.presentSeconds / 60}m presentation + {SLOT.qaSeconds / 60}m Q&amp;A. Alerts chime at the end of each phase.
              </p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon">
              <Icon name="check" size={26} />
            </span>
            <div>
              <h3>7-Criteria Scoring</h3>
              <p>Rate 0–10 with decimals (e.g. 8.5) and provide feedback. Total score is weighted out of 100.</p>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
}

/* ---------- Signed in Juror Dashboard ---------- */

function JurorHome({
  juror,
  openId,
  setOpenId,
}: {
  juror: Juror;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const st = useJury();
  const session = st.session[juror.panel];
  const slot = slotOf(session);
  const [toast, setToast] = useState<{ phase: Phase; team: string } | null>(null);
  const [savedTeamId, setSavedTeamId] = useState<string | null>(null);
  const editSavedScore = useRef<HTMLButtonElement>(null);

  const { phase, elapsed } = usePhaseAlerts(session, (to) => {
    setToast({ phase: to, team: session.teamId ?? '' });
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const order = st.order[juror.panel];
  const mine = order.map((id) => st.teams.find((t) => t.id === id)!).filter(Boolean);
  const done = mine.filter((t) => st.evals[t.id]?.[juror.id]).length;
  const pending = mine.length - done;
  const current = session.teamId ? st.teams.find((t) => t.id === session.teamId) ?? null : null;
  const open = openId ? mine.find((t) => t.id === openId) ?? null : null;
  const savedTeam = mine.find((team) => team.id === savedTeamId && st.evals[team.id]?.[juror.id]);

  useEffect(() => {
    if (!open && savedTeamId) editSavedScore.current?.focus();
  }, [open, savedTeamId]);

  return (
    <>
      {toast && (
        <div className={`p2-toast-big is-${toast.phase}`} role="alert">
          <span className="p2-bell" aria-hidden="true">
            <Icon name="bell" size={30} />
          </span>
          <div>
            <strong>{toast.phase === 'qa' ? 'Presentation time ended' : 'Time completed'}</strong>
            <p>
              {toast.phase === 'qa'
                ? `Q&A session is now underway for ${st.teams.find((t) => t.id === toast.team)?.title ?? 'this team'}.`
                : 'Presentation and Q&A time are complete. Please finalize and submit your evaluation.'}
            </p>
          </div>
          <button type="button" className="p2-copy" onClick={() => setToast(null)}>
            Acknowledge
          </button>
        </div>
      )}

      {!open && savedTeam && (
        <div className="callout">
          <p role="status"><strong>Score saved</strong> · {savedTeam.title}</p>
          <button
            ref={editSavedScore}
            type="button"
            className="button outline small"
            onClick={() => setOpenId(savedTeam.id)}
          >
            Edit submitted score
          </button>
        </div>
      )}

      {/* Live Stage Strip */}
      {current && (
        <LiveStrip
          compact={open?.id === current.id}
          team={current}
          phase={phase}
          elapsed={elapsed}
          slot={slot}
          running={session.running}
          onScore={() => setOpenId(current.id)}
          scored={!!st.evals[current.id]?.[juror.id]}
          showScore={open?.id !== current.id}
        />
      )}

      {open ? (
        <ScoreSheet
          key={open.id}
          live={session.teamId === open.id ? { phase, elapsed, running: session.running, slot } : null}
          team={open}
          index={order.indexOf(open.id)}
          initial={st.evals[open.id]?.[juror.id]}
          onBack={() => setOpenId(null)}
          onSubmit={async (scores, comment) => {
            const res = await jury.submitEval(open.id, scores, comment);
            if (res !== false) {
              setSavedTeamId(open.id);
              setOpenId(null);
            }
          }}
        />
      ) : (
        <>
          {/* Dashboard Metrics Header */}
          <div className="schedule-timeline-intro p2-art-hero p2-art-hero-sm">
            <WaveField density={0.8} />
            <div className="p2-art-hero-copy">
              <p className="p2-art-kicker">
                {juror.name} · {PANEL_NAMES[juror.panel]}
              </p>
              <h2>
                Assigned <em>teams.</em>
              </h2>
            </div>
            <div className="p2-queue-progress">
              <Ring value={done} max={mine.length || 1} size={68} stroke={5}>
                {done}/{mine.length}
              </Ring>
              <p>
                <strong>{pad(done)}</strong> of {pad(mine.length)} evaluated
              </p>
            </div>
          </div>

          {/* Module 3 Key Metrics Cards */}
          <div className="p2-juror-stats" aria-label="Jury Dashboard Overview">
            <div className="p2-stat-card">
              <span className="p2-stat-label">Judge</span>
              <strong className="p2-stat-val">{juror.name}</strong>
              <small className="p2-stat-sub">{juror.designation || 'Evaluation Committee'}</small>
            </div>
            <div className="p2-stat-card">
              <span className="p2-stat-label">Assigned Panel</span>
              <strong className="p2-stat-val accent">{PANEL_NAMES[juror.panel]}</strong>
              <small className="p2-stat-sub">{mine.length} total teams</small>
            </div>
            <div className="p2-stat-card">
              <span className="p2-stat-label">Evaluation Status</span>
              <strong className="p2-stat-val">
                {done} <span className="muted">/ {mine.length}</span>
              </strong>
              <small className="p2-stat-sub">
                {pending === 0 ? 'All completed ✓' : `${pending} pending`}
              </small>
            </div>
            <div className="p2-stat-card">
              <span className="p2-stat-label">Stage Activity</span>
              <strong className="p2-stat-val">
                {current ? PHASE_LABEL[phase] : 'Idle'}
              </strong>
              <small className="p2-stat-sub">
                {current ? `${clock(remainingOf(phase, elapsed, slot))} · ${current.code}` : 'Awaiting start'}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0.5rem 0' }}>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                unlockAudio();
                beep(1);
              }}
            >
              🔔 Test alert chime
            </button>
          </div>

          <details className="p2-rubric-reference">
            <summary>Judging criteria and weights</summary>
            <table>
              <thead>
                <tr><th scope="col">Evaluation criterion</th><th scope="col">Weight</th></tr>
              </thead>
              <tbody>
                {CRITERIA.map(({ id, label, weightage }) => (
                  <tr key={id}><th scope="row">{label}</th><td>{weightage}%</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th><td>{CRITERIA.reduce((sum, criterion) => sum + criterion.weightage, 0)}%</td></tr>
              </tfoot>
            </table>
          </details>

          {mine.length === 0 ? (
            <p className="empty">
              Teams have not been assigned to {PANEL_NAMES[juror.panel]} yet. This list updates automatically when the admin assigns teams.
            </p>
          ) : (
            <ol className="p2-queue">
              {mine.map((t, i) => {
                const ev = st.evals[t.id]?.[juror.id];
                const selected = session.teamId === t.id;
                const live = selected && session.running && (phase === 'present' || phase === 'qa');
                const upNext = !!session.teamId && order.indexOf(session.teamId) + 1 === i;
                const scoreValue = ev ? totalWeightedScore(ev.scores) : 0;
                return (
                  <li
                    key={t.id}
                    className={`${ev ? 'is-done' : ''}${live ? ' is-live' : ''}`.trim() || undefined}
                  >
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
                        {t.college} · {t.members.join(', ')}
                      </p>
                    </div>
                    <div className="p2-queue-action">
                      {ev ? (
                        <div className="p2-score-badge" title="Total weighted score out of 100">
                          <span className="p2-score-num">{scoreValue.toFixed(2)}</span>
                          <span className="p2-score-den">/ 100 pts</span>
                        </div>
                      ) : selected ? (
                        <span className={live ? `p2-phase is-${phase}` : 'p2-phase'}>
                          {live && <i aria-hidden="true" />}
                          {live && phase === 'present' ? 'Presenting' : PHASE_LABEL[phase]}
                          {!session.running && (phase === 'present' || phase === 'qa') ? ' (paused)' : ''}
                        </span>
                      ) : upNext ? (
                        <span className="p2-phase">Up next</span>
                      ) : (
                        <span className="p2-meta">Pending</span>
                      )}
                      <button
                        type="button"
                        className={ev ? 'button outline small' : 'button small'}
                        onClick={() => setOpenId(t.id)}
                      >
                        {ev ? 'Edit score' : 'Evaluate'} <span aria-hidden="true">→</span>
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
  slot,
  running,
  onScore,
  scored,
  showScore,
}: {
  compact: boolean;
  team: Team;
  phase: Phase;
  elapsed: number;
  slot: ReturnType<typeof slotOf>;
  running: boolean;
  onScore: () => void;
  scored: boolean;
  showScore: boolean;
}) {
  const pct = Math.min(100, (elapsed / slot.totalSeconds) * 100);
  return (
    <section className={`p2-livestrip is-${phase}${compact ? ' is-sheet' : ''}`} aria-label="Stage timer">
      <div>
        <p className="p2-label">
          {running ? <i className="p2-live-dot" aria-hidden="true" /> : null} Stage Timer · {PHASE_LABEL[phase]}
          {!running && phase !== 'ready' && phase !== 'over' ? ' (paused)' : ''}
        </p>
        <h2>{team.title}</h2>
      </div>
      <div className="p2-livestrip-clock">
        <span role="timer">{clock(remainingOf(phase, elapsed, slot))}</span>
        <div className="p2-split-bar" aria-hidden="true">
          <span className="p2-split-fill" style={{ width: `${pct}%` }} />
          <i style={{ left: `${slot.presentSeconds / slot.totalSeconds * 100}%` }} />
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

/* ---------- 7-Criteria Score Sheet with Numeric Inputs ---------- */

function ScoreSheet({
  live,
  team,
  index,
  initial,
  onBack,
  onSubmit,
}: {
  live: { phase: Phase; elapsed: number; running: boolean; slot: ReturnType<typeof slotOf> } | null;
  team: Team;
  index: number;
  initial?: { scores: Scores; comment: string };
  onBack: () => void;
  onSubmit: (s: Scores, comment: string) => void;
}) {
  const [s, setS] = useState<Scores>(initial?.scores ?? blankScores());
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState('');
  const [rawInputs, setRawInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of CRITERIA) {
      const val = initial?.scores?.[c.id];
      init[c.id] = val !== undefined && val > 0 ? String(val) : '';
    }
    return init;
  });

  const sum = totalWeightedScore(s);
  const filled = CRITERIA.filter((c) => (s[c.id] ?? 0) > 0).length;

  function handleScoreChange(id: string, text: string) {
    setRawInputs((prev) => ({ ...prev, [id]: text }));
    if (text === '') {
      setS((prev) => ({ ...prev, [id as keyof Scores]: 0 }));
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val) && val >= 0 && val <= MAX_PER_CRITERION) {
      setS((prev) => ({ ...prev, [id as keyof Scores]: Math.round(val * 100) / 100 }));
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = CRITERIA.filter((c) => {
      const val = s[c.id];
      return typeof val !== 'number' || isNaN(val) || val <= 0;
    });
    if (missing.length) {
      return setError(`Please enter a score (0.1–10) for: ${missing.map((c) => c.shortLabel).join(', ')}.`);
    }
    setError('');
    onSubmit(s, comment.trim());
  }

  return (
    <form className="p2-sheet" onSubmit={submit}>
      <button type="button" className="text-link p2-back" onClick={onBack}>
        <span aria-hidden="true">←</span> Back to all teams
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

      <section aria-labelledby="jury-abstract-title" className="p2-criteria-section">
        <div className="p2-criteria-header">
          <h2 id="jury-abstract-title">Project abstract</h2>
          {team.description?.trim() && <p style={{ whiteSpace: 'pre-wrap' }}>{team.description}</p>}
          <a className="button outline small" href={`/api/jury/abstract?team=${encodeURIComponent(team.id)}`} target="_blank" rel="noopener noreferrer">
            Open abstract PDF
          </a>
        </div>
      </section>

      {/* Summary Score Strip & 7-Axis Radar */}
      <dl className="detail-strip p2-sheet-strip">
        <div>
          <dt>Criteria scored</dt>
          <dd>
            {filled}
            <small> / {CRITERIA.length}</small>
          </dd>
          <span className="p2-pips" aria-hidden="true">
            {CRITERIA.map((c) => (
              <i key={c.id} className={s[c.id] > 0 ? 'is-on' : undefined} />
            ))}
          </span>
          <p className="p2-strip-sub">7 Official Criteria</p>
        </div>
        <div className="p2-radar-cell">
          <dt>7-Axis Evaluation Profile</dt>
          <ScoreRadar scores={s} size={200} />
        </div>
        <div>
          <dt>Total Weighted Score</dt>
          <div className="p2-sum-wrap">
            <Ring value={sum} max={MAX_TOTAL} size={84} stroke={5}>
              {Math.round((sum / MAX_TOTAL) * 100)}%
            </Ring>
            <dd className="accent p2-sum" key={sum}>
              {sum.toFixed(2)}
              <small> / {MAX_TOTAL}</small>
            </dd>
          </div>
          <p className="p2-strip-sub">Sum of weighted points</p>
        </div>
      </dl>

      {/* 7 Official Criteria Numeric Inputs */}
      <section className="p2-criteria-section">
        <div className="p2-criteria-header">
          <h2>Official Evaluation Rubric</h2>
          <p className="muted">
            Enter marks from <strong>0 to 10</strong> for each criterion. Decimals are accepted (e.g. 7.5, 8.25).
            The weighted contribution is automatically calculated.
          </p>
        </div>

        <div className="p2-criteria-grid">
          {CRITERIA.map((c, i) => {
            const rawVal = rawInputs[c.id] ?? '';
            const mark = s[c.id] || 0;
            const weighted = criterionWeightedScore(mark, c.weightage);
            const isValid = mark >= 0 && mark <= 10;

            return (
              <div key={c.id} className={`p2-crit-card ${mark > 0 ? 'is-active' : ''}`}>
                <div className="p2-crit-card-top">
                  <span className="p2-crit-idx">0{i + 1}</span>
                  <div className="p2-crit-title-wrap">
                    <h3>{c.label}</h3>
                    <p className="p2-crit-hint">{c.hint}</p>
                  </div>
                  <span className="p2-weight-badge">{c.weightage}% Weightage</span>
                </div>

                <div className="p2-crit-card-bottom">
                  <div className="p2-input-group">
                    <label htmlFor={`crit-input-${c.id}`}>Marks (0–10):</label>
                    <div className="p2-num-box">
                      <input
                        id={`crit-input-${c.id}`}
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        placeholder="0.00"
                        value={rawVal}
                        onChange={(e) => handleScoreChange(c.id, e.target.value)}
                        className={!isValid ? 'has-error' : ''}
                      />
                      <span className="p2-max-tag">/ 10</span>
                    </div>
                  </div>

                  <div className="p2-preset-steppers">
                    {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`p2-step-btn ${mark === v ? 'is-selected' : ''}`}
                        onClick={() => handleScoreChange(c.id, String(v))}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="p2-crit-weighted">
                    <span className="muted">Contribution:</span>
                    <strong>{weighted.toFixed(2)}</strong>
                    <small>/ {c.weightage} pts</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dedicated Structured Comments Field */}
      <div className="field wide p2-remarks">
        <label htmlFor="remarks">
          <strong>Judge Feedback &amp; Observations</strong>
          <span className="muted"> (For organisers and final panel deliberation)</span>
        </label>
        <p className="p2-remarks-hint">
          Please note key <strong>strengths</strong>, <strong>technical weaknesses</strong>, and <strong>recommendations</strong>.
        </p>
        <textarea
          id="remarks"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Strengths: ...&#10;Weaknesses: ...&#10;Suggestions for improvement: ...&#10;General observations: ..."
        />
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {/* Informational Stage Timer Banner & Sticky Action Bar */}
      <div className="p2-sheet-bar">
        {live ? (
          <span className={`p2-sheet-live is-${live.phase}`} role="timer">
            <i aria-hidden="true" />
            Stage: {PHASE_LABEL[live.phase]} <b>{clock(remainingOf(live.phase, live.elapsed, live.slot))}</b>
            <small style={{ marginLeft: '0.5rem', opacity: 0.8 }}>(Informational only)</small>
          </span>
        ) : (
          <span className="p2-sheet-live muted">Stage timer is idle</span>
        )}

        <span className="p2-sheet-bar-total">
          <small>Total Weighted</small>
          <strong>{sum.toFixed(2)}</strong>
          <em>/ {MAX_TOTAL}</em>
        </span>

        <button type="button" className="button outline" onClick={onBack}>
          Cancel
        </button>
        <button className="button" type="submit">
          {initial ? 'Update score' : 'Submit evaluation'} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
