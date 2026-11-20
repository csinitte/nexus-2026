'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { PreviewBanner } from './PreviewBanner';
import { Ring } from './Fx';
import {
  ASSIGNMENTS,
  CRITERIA,
  JURORS,
  MAX_PER_CRITERION,
  MAX_TOTAL,
  PROJECTS,
  SCORES,
  SLOT,
  total,
  type Juror,
  type MockProject,
  type Scores,
} from './mock';

const blank = (): Scores => ({ innovation: 0, relevance: 0, technical: 0, demo: 0, presentation: 0 });
const pad = (n: number) => String(n).padStart(2, '0');

export function JuryPortal() {
  const [juror, setJuror] = useState<Juror | null>(null);
  const [scores, setScores] = useState<Record<string, Scores>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const mine = useMemo(() => (juror ? PROJECTS.filter((p) => ASSIGNMENTS[p.id]?.includes(juror.id)) : []), [juror]);

  // Preview: only the first project starts as already scored.
  useEffect(() => {
    if (!juror) return;
    const first = mine.find((p) => SCORES[p.id]?.[juror.id]);
    queueMicrotask(() => setScores(first ? { [first.id]: SCORES[first.id][juror.id] } : {}));
  }, [juror, mine]);

  const open = mine.find((p) => p.id === openId);
  const done = mine.filter((p) => scores[p.id]).length;

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Jury portal{juror ? ` · ${juror.name}` : ''} {juror && <em>juror</em>}
        </span>
        {juror && (
          <button
            type="button"
            className="button outline small"
            onClick={() => {
              setJuror(null);
              setOpenId(null);
            }}
          >
            Sign out
          </button>
        )}
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        <PreviewBanner note={juror ? 'Scores stay in this tab only' : 'Any password of 4+ characters works'} />
        {!juror ? (
          <JuryAccess onSignedIn={setJuror} />
        ) : open ? (
          <ScoreSheet
            key={open.id}
            project={open}
            initial={scores[open.id]}
            onBack={() => setOpenId(null)}
            onSubmit={(s) => {
              setScores((all) => ({ ...all, [open.id]: s }));
              setJustSaved(open.id);
              setOpenId(null);
              setTimeout(() => setJustSaved(null), 2600);
            }}
          />
        ) : (
          <>
            <div className="schedule-timeline-intro">
              <div>
                <p className="eyebrow">
                  {juror.name} · {juror.designation}
                </p>
                <h2>
                  Your <em>projects.</em>
                </h2>
              </div>
              <div className="p2-queue-progress">
                <Ring value={done} max={mine.length} size={64} stroke={5}>
                  {done}/{mine.length}
                </Ring>
                <p>
                  <strong>{pad(done)}</strong> of {pad(mine.length)} scored <span aria-hidden="true">/</span> Expo 2:00–4:00 PM
                </p>
              </div>
            </div>
            {justSaved && (
              <p className="p2-toast" role="status">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                Score saved for {mine.find((p) => p.id === justSaved)?.title}
              </p>
            )}
            {mine.length === 0 ? (
              <p className="empty">No projects assigned to you yet. The organising team will assign them before the Expo.</p>
            ) : (
              <ol className="p2-queue">
                {mine.map((p) => {
                  const s = scores[p.id];
                  return (
                    <li key={p.id} className={`${s ? 'is-done' : ''}${justSaved === p.id ? ' is-saved' : ''}`.trim() || undefined}>
                      <span className="p2-queue-table">
                        <small>Table</small>
                        {p.table.slice(1)}
                      </span>
                      <div className="p2-queue-body">
                        <p className="p2-label">
                          {p.code} <span>· {p.category}</span>
                        </p>
                        <h3>{p.title}</h3>
                        <p className="muted">
                          {p.college} · {p.team.length} members
                        </p>
                      </div>
                      <div className="p2-queue-action">
                        {s ? (
                          <Ring value={total(s)} max={MAX_TOTAL} size={54}>
                            {total(s)}
                          </Ring>
                        ) : (
                          <span className="p2-meta">Not scored</span>
                        )}
                        <button type="button" className={s ? 'button outline small' : 'button small'} onClick={() => setOpenId(p.id)}>
                          {s ? 'Edit' : 'Score'} <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- Sign in / set up account ---------- */

function JuryAccess({ onSignedIn }: { onSignedIn: (j: Juror) => void }) {
  const [mode, setMode] = useState<'signin' | 'setup'>('signin');

  return (
    <>
      <div>
      <header className="page-intro">
        <div className="section-label">
          <span>01 / Student Project Expo</span>
          <span>Jury access</span>
        </div>
        <p className="eyebrow">
          <span className="dot" aria-hidden="true" />
          For invited jurors
        </p>
        <h1>
          Jury <em>portal.</em>
        </h1>
        <p className="page-intro-body">Score the Student Project Expo from your phone or laptop — one team at a time, right at their table.</p>
      </header>
      </div>

      <div className="p2-access">
        <div className="p2-access-form">
          <div className="p2-switch" role="tablist" aria-label="Jury access">
            <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'setup'} onClick={() => setMode('setup')}>
              First time? Set up account
            </button>
          </div>
          {mode === 'signin' ? <SignIn onSignedIn={onSignedIn} /> : <SetUp onSignedIn={onSignedIn} />}
        </div>

        <ol className="p2-how" aria-label="How judging works">
          <li>
            <span>01</span>
            <div>
              <h3>Accept your invite</h3>
              <p>Use the code in your NEXUS jury email to set a password.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Score your teams</h3>
              <p>
                Each team gets {SLOT.presentSeconds / 60} min to present and demo, then {SLOT.qaSeconds / 60} min of jury Q&amp;A.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Submit by 4:00 PM</h3>
              <p>Scores lock when the Expo closes. Results are announced at the valedictory.</p>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (j: Juror) => void }) {
  const [email, setEmail] = useState(JURORS.find((j) => j.status === 'active')?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const j = JURORS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!j) return setError('This email is not on the jury list.');
    if (j.status !== 'active') return setError('Set up your account first using the code from your invite.');
    if (password.length < 4) return setError('Enter your password.');
    onSignedIn(j);
  }

  return (
    <form className="p2-access-fields" onSubmit={submit}>
      <div className="field wide">
        <label htmlFor="jury-email">Email</label>
        <input id="jury-email" type="email" autoComplete="username" list="jury-emails" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <datalist id="jury-emails">
          {JURORS.map((j) => (
            <option key={j.id} value={j.email} />
          ))}
        </datalist>
      </div>
      <div className="field wide">
        <label htmlFor="jury-password">Password</label>
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
  );
}

function SetUp({ onSignedIn }: { onSignedIn: (j: Juror) => void }) {
  const invited = JURORS.find((j) => j.status === 'invited');
  const [code, setCode] = useState('');
  const [name, setName] = useState(invited?.name ?? '');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return setError('Enter the invite code from your email.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirm) return setError('The passwords don’t match.');
    if (!invited) return setError('No pending invites in this preview.');
    onSignedIn({ ...invited, name: name.trim() || invited.name, designation: designation.trim() || invited.designation, status: 'active' });
  }

  return (
    <form className="p2-access-fields" onSubmit={submit}>
      <div className="fields">
        <div className="field wide">
          <label htmlFor="setup-code">Invite code</label>
          <input id="setup-code" autoComplete="one-time-code" placeholder="From your NEXUS jury email" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="setup-name">Full name</label>
          <input id="setup-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="setup-desig">Designation & organisation</label>
          <input id="setup-desig" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="setup-pass">Password</label>
          <input id="setup-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <span className="field-hint">At least 8 characters</span>
        </div>
        <div className="field">
          <label htmlFor="setup-confirm">Confirm password</label>
          <input id="setup-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button className="button">
        Create account <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

/* ---------- Score sheet ---------- */

function fmt(sec: number) {
  const s = Math.abs(sec);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

function useSlotTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const end = SLOT.presentSeconds + SLOT.qaSeconds;
  const inQa = elapsed >= SLOT.presentSeconds;
  const over = elapsed > end;
  const left = (inQa ? end : SLOT.presentSeconds) - elapsed;
  return {
    elapsed,
    running,
    end,
    phase: over ? 'Over time' : inQa ? 'Jury Q&A' : 'Presentation & demo',
    display: over ? `+${fmt(elapsed - end)}` : fmt(left),
    remainingPhase: Math.max(0, left),
    phaseLength: inQa ? SLOT.qaSeconds : SLOT.presentSeconds,
    over,
    inQa,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setRunning(false);
      setElapsed(0);
    },
  };
}

function ScoreSheet({
  project,
  initial,
  onBack,
  onSubmit,
}: {
  project: MockProject;
  initial?: Scores;
  onBack: () => void;
  onSubmit: (s: Scores) => void;
}) {
  const [s, setS] = useState<Scores>(initial ?? blank());
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const timer = useSlotTimer();
  const sum = total(s);
  const filled = CRITERIA.filter((c) => s[c.id] > 0).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = CRITERIA.filter((c) => s[c.id] === 0);
    if (missing.length) return setError(`Still to score: ${missing.map((c) => c.label).join(', ')}.`);
    onSubmit(s);
  }

  return (
    <form className="p2-sheet" onSubmit={submit}>
      <button type="button" className="text-link p2-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All projects
      </button>

      <header className="p2-sheet-head">
        <p className="p2-label">
          Table {project.table.slice(1)} <span>· {project.code} · {project.category}</span>
        </p>
        <h1>{project.title}</h1>
        <p className="muted">
          {project.college} · {project.team.join(', ')}
        </p>
      </header>

      <dl className="detail-strip p2-sheet-strip">
        <div className={`p2-timer-cell${timer.inQa ? ' is-qa' : ''}${timer.over ? ' is-over' : ''}`}>
          <dt>{timer.phase}</dt>
          <div className="p2-timer-main">
            <Ring value={timer.over ? 0 : timer.remainingPhase} max={timer.phaseLength} size={84} stroke={5}>
              {timer.inQa ? 'Q&A' : 'Demo'}
            </Ring>
            <dd className="p2-timer-value" role="timer">
              {timer.display}
            </dd>
          </div>
          <span className="p2-timer-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (timer.elapsed / timer.end) * 100)}%` }} />
            <i style={{ left: `${(SLOT.presentSeconds / timer.end) * 100}%` }} />
          </span>
          <div className="p2-timer-actions">
            <button type="button" className="button small" onClick={timer.toggle}>
              {timer.running ? 'Pause' : timer.elapsed ? 'Resume' : 'Start 7 + 3'}
            </button>
            {timer.elapsed > 0 && (
              <button type="button" className="text-link" onClick={timer.reset}>
                Reset
              </button>
            )}
          </div>
        </div>
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
        {CRITERIA.map((c, i) => (
          <li key={c.id}>
            <div className="p2-crit-label" id={`c-${c.id}`}>
              <span className="p2-crit-num">{pad(i + 1)}</span>
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
        <label htmlFor="remarks">Remarks for the organising team (optional)</label>
        <textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Anything the jury should discuss, or a tie-break note" />
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <div className="p2-sheet-bar">
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
