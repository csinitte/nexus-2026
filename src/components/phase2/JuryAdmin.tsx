'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { Ring } from './Fx';
import { StageClock } from './StageClock';
import { WaveField } from './WaveField';
import { Icon, type IconName } from './Icons';
import { CRITERIA, MAX_PER_CRITERION, MAX_TOTAL, PANEL_NAMES, SLOT, total, type Team, type IssuedCredential, type PanelId } from './jury-types';
import { averageOf, jury, useJuryConnection, type JuryState } from './juryStore';
import { PHASE_LABEL, clock, phaseOf, remainingOf, unlockAudio, useNow, usePhaseAlerts } from './juryTimer';
import { elapsedOf } from './juryStore';

const TABS = [
  ['jury', 'Jury & logins', 'key'],
  ['panels', 'Panels', 'panels'],
  ['live', 'Live timer', 'timer'],
  ['scores', 'Scores & comments', 'comments'],
  ['board', 'Leaderboards', 'podium'],
] as const;
type Tab = (typeof TABS)[number][0];

const PANELS: PanelId[] = [1, 2];
const pad = (n: number) => String(n).padStart(2, '0');
const teamById = (st: JuryState, id: string) => st.teams.find((t) => t.id === id)!;

export function JuryAdmin() {
  const { state: st, status, error } = useJuryConnection('admin');
  const [tab, setTab] = useState<Tab>('jury');

  if (status !== 'ready') return (
    <div className="admin-shell">
      <main id="main" className="admin-main">
        <h1>Jury control</h1>
        <p role="status">{status === 'loading' ? 'Checking organiser access…' : error || 'Sign in to the admin dashboard first.'}</p>
        <Link className="button" href="/admin">Open admin dashboard</Link>
      </main>
    </div>
  );

  const assigned = st.order[1].length + st.order[2].length;
  const evaluated = st.teams.filter((t) => {
    const p = st.order[1].includes(t.id) ? 1 : st.order[2].includes(t.id) ? 2 : null;
    if (!p) return false;
    const need = st.jurors.filter((j) => j.panel === p).length;
    return need > 0 && Object.keys(st.evals[t.id] ?? {}).length >= need;
  }).length;
  const live = PANELS.filter((p) => st.session[p].running).length;

  const kpis = [
    { icon: 'jury' as IconName, label: 'Jury members', value: st.jurors.length, max: st.jurors.length || 1, note: `${st.jurors.filter((j) => j.panel === 1).length} in Panel 1 · ${st.jurors.filter((j) => j.panel === 2).length} in Panel 2` },
    { icon: 'grid' as IconName, label: 'Teams assigned', value: assigned, max: st.teams.length, note: `of ${st.teams.length} Expo teams` },
    { icon: 'check' as IconName, label: 'Fully scored', value: evaluated, max: st.teams.length, note: 'all panel jurors submitted' },
    { icon: 'trophy' as IconName, label: 'Finalists', value: st.finalists.length, max: st.teams.length, note: st.finalsLocked ? 'confirmed' : 'not confirmed yet' },
  ];

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Jury control <em>admin</em>
        </span>
        <LiveChips st={st} />
        <Link className="button outline small" href="/jury" target="_blank">
          Open jury portal ↗
        </Link>
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <Link className="text-link" href="/admin">Back to organiser dashboard</Link>
        <section className="p2-art-hero p2-admin-hero">
          <div className="p2-art-hero-copy">
            <p className="p2-art-kicker">
              Student Project Expo · Jury{live ? ` · ${live} panel${live > 1 ? 's' : ''} live` : ''}
            </p>
            <h1>
              Jury <em>control.</em>
            </h1>
          </div>
          <WaveField />
        </section>

        <dl className="p2-kpis">
          {kpis.map((k) => (
            <div key={k.label}>
              <Ring value={k.value} max={k.max} size={58}>
                <Icon name={k.icon} size={22} />
              </Ring>
              <div>
                <dt>{k.label}</dt>
                <dd>{k.value}</dd>
                <p className="p2-meta">{k.note}</p>
              </div>
            </div>
          ))}
        </dl>

        <StepGuide st={st} tab={tab} setTab={setTab} assigned={assigned} evaluated={evaluated} />

        <section key={tab} id={`panel-${tab}`} aria-label={TABS.find((t) => t[0] === tab)?.[1]} className="p2-panel">
          {tab === 'jury' && <JuryTab st={st} />}
          {tab === 'panels' && <PanelsTab st={st} />}
          {tab === 'live' && <LiveTab st={st} />}
          {tab === 'scores' && <ScoresTab st={st} />}
          {tab === 'board' && <BoardTab st={st} />}
        </section>


      </main>
    </div>
  );
}

/** Always-visible status of both panels' timers, on every tab. */
function LiveChips({ st }: { st: JuryState }) {
  const now = useNow(500);
  return (
    <span className="p2-livechips">
      {PANELS.map((p) => {
        const s = st.session[p];
        if (!s.teamId) return null;
        const el = elapsedOf(s, now);
        const ph = phaseOf(s, el);
        return (
          <span key={p} className={`p2-livechip is-${ph}${s.running ? ' is-running' : ''}`}>
            <i aria-hidden="true" />P{p} · {PHASE_LABEL[ph]} <b>{clock(remainingOf(ph, el))}</b>
          </span>
        );
      })}
    </span>
  );
}

/** One clear "do this next" card + a 5-step progress line, so admins never have to guess the order. */
function StepGuide({
  st,
  tab,
  setTab,
  assigned,
  evaluated,
}: {
  st: JuryState;
  tab: Tab;
  setTab: (t: Tab) => void;
  assigned: number;
  evaluated: number;
}) {
  const anyStarted = PANELS.some((p) => st.session[p].teamId);
  const done: Record<Tab, boolean> = {
    jury: st.jurors.length >= 2 && PANELS.every((p) => st.jurors.some((j) => j.panel === p)),
    panels: assigned > 0 && assigned === st.teams.length,
    live: evaluated > 0 && evaluated === st.teams.length,
    scores: evaluated > 0 && evaluated === st.teams.length,
    board: st.finalsLocked,
  };
  const order: Tab[] = ['jury', 'panels', 'live', 'scores', 'board'];
  const current = order.find((t) => !done[t]) ?? 'board';

  const next: Record<Tab, { title: string; text: string; cta: string; act: () => void }> = {
    jury: {
      title: 'Add your jury',
      text: 'Each juror gets a login automatically. Put them in Panel 1 or Panel 2.',
      cta: 'Add jury members',
      act: () => setTab('jury'),
    },
    panels: {
      title: 'Split the teams into 2 panels',
      text: `One click shuffles all ${st.teams.length} teams and splits them evenly.`,
      cta: 'Assign teams randomly',
      act: () => {
        jury.randomAssign();
        setTab('panels');
      },
    },
    live: {
      title: anyStarted ? 'Judging in progress' : 'Start judging',
      text: anyStarted
        ? `${evaluated} of ${st.teams.length} teams fully scored. Use Next team when a team finishes.`
        : 'Press Start on each panel below. Each team gets 5 min presentation + 5 min Q&A.',
      cta: anyStarted ? 'Open live timer' : 'Start the timer',
      act: () => setTab('live'),
    },
    scores: {
      title: 'Check scores',
      text: 'See every judge’s marks and comments.',
      cta: 'View scores',
      act: () => setTab('scores'),
    },
    board: {
      title: st.finalsLocked ? 'Final teams confirmed 🎉' : 'Pick the final teams',
      text: st.finalsLocked ? `${st.finalists.length} teams go to the final.` : 'Look at each panel’s ranking, tick the finalists, then confirm.',
      cta: st.finalsLocked ? 'View final teams' : 'Choose finalists',
      act: () => setTab('board'),
    },
  };
  const n = next[current];
  const labels: Record<Tab, string> = { jury: 'Jury', panels: 'Panels', live: 'Judging', scores: 'Scores', board: 'Final teams' };

  return (
    <section className="p2-guide" aria-label="What to do next">
      <ol className="p2-guide-steps">
        {order.map((t, i) => (
          <li key={t} className={`${done[t] ? 'is-done' : ''}${t === current ? ' is-current' : ''}${t === tab ? ' is-open' : ''}`.trim() || undefined}>
            <button type="button" onClick={() => setTab(t)}>
              <span className="p2-guide-dot">{done[t] ? <Icon name="check" size={16} /> : i + 1}</span>
              <span className="p2-guide-label">{labels[t]}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="p2-guide-next">
        <div>
          <p className="p2-label">
            Next step <span>· {order.indexOf(current) + 1} of 5</span>
          </p>
          <h2>{n.title}</h2>
          <p>{n.text}</p>
        </div>
        {tab !== current || current === 'board' ? (
          <button
            type="button"
            className="button"
            onClick={() => {
              n.act();
              requestAnimationFrame(() => document.getElementById(`panel-${current}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }}
          >
            {n.cta} <span aria-hidden="true">→</span>
          </button>
        ) : (
          <span className="p2-guide-here">
            <Icon name="next" size={14} /> You’re on it — see below
          </span>
        )}
      </div>
    </section>
  );
}

function PanelHead({ title, accent, meta, children }: { title: string; accent: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div className="p2-panel-head">
      <div>
        <h2>
          {title} <em>{accent}</em>
        </h2>
        {meta && <p className="p2-meta">{meta}</p>}
      </div>
      {children && <div className="p2-panel-actions">{children}</div>}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => /^[a-z]/i.test(w) && !/^(dr|prof)\.?$/i.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ---------- 01 Jury & logins ---------- */

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="p2-copy"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? '✓ Copied' : label}
    </button>
  );
}

function JuryTab({ st }: { st: JuryState }) {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [panel, setPanel] = useState<PanelId>(2);
  const [created, setCreated] = useState<IssuedCredential | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const j = await jury.addJuror({ name: name.trim(), designation: designation.trim() || `Jury · ${PANEL_NAMES[panel]}`, email: email.trim(), panel });
    if (!j) return;
    setCreated(j);
    setName('');
    setDesignation('');
    setEmail('');
  }

  return (
    <div className="p2-two">
      <div>
        <PanelHead title="Jury" accent="members." meta={`${st.jurors.length} jurors · each gets a username and password for /jury`} />
        <ul className="p2-rows">
          {st.jurors.map((j) => {
            return (
              <li key={j.id} className="p2-juror">
                <span className="p2-initials" aria-hidden="true">
                  {initials(j.name)}
                  <b>P{j.panel}</b>
                </span>
                <div>
                  <h3>{j.name}</h3>
                  <p className="muted">{j.designation}</p>
                  <div className="p2-cred">
                    <span>
                      <small>User</small> {j.username}
                    </span>
                  </div>
                </div>
                <div className="p2-row-end p2-row-stack">
                  <select className="p2-select small" value={j.panel} onChange={(e) => jury.setJurorPanel(j.id, Number(e.target.value) as PanelId)} aria-label={`Panel for ${j.name}`}>
                    <option value={1}>Panel 1</option>
                    <option value={2}>Panel 2</option>
                  </select>
                  <button type="button" className="text-link" onClick={async () => {
                    const credential = await jury.resetPassword(j.id);
                    if (credential) setCreated(credential);
                  }}>
                    Issue new password
                  </button>
                  <button type="button" className="text-link p2-danger" onClick={() => jury.removeJuror(j.id)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <form className="p2-side-form" onSubmit={submit}>
        <p className="p2-label">Add a jury member</p>
        <p className="muted">A login is created straight away. Share it with them before the Expo.</p>
        <div className="field wide">
          <label htmlFor="j-name">Full name</label>
          <input id="j-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Ramesh Rao" required />
        </div>
        <div className="field wide">
          <label htmlFor="j-desig">Designation (optional)</label>
          <input id="j-desig" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Professor, CSE · NMAMIT" />
        </div>
        <div className="field wide">
          <label htmlFor="j-email">Email (optional)</label>
          <input id="j-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <fieldset className="p2-chipset p2-chipset-radio">
          <legend>Panel</legend>
          {PANELS.map((p) => (
            <label key={p}>
              <input type="radio" name="j-panel" checked={panel === p} onChange={() => setPanel(p)} />
              <span>{PANEL_NAMES[p]}</span>
            </label>
          ))}
        </fieldset>
        <button className="button">
          Add & create login <span aria-hidden="true">↗</span>
        </button>
        {created && (
          <div className="p2-newcred" role="status">
            <p className="p2-label">Login issued · {created.name}</p>
            <p>Copy this password now. It won’t be shown again.</p>
            <p>
              <small>Username</small> <b>{created.username}</b>
            </p>
            <p>
              <small>Password</small> <b>{created.password}</b>
            </p>
            <CopyButton text={`NEXUS jury login\nUsername: ${created.username}\nPassword: ${created.password}`} label="Copy login" />
          </div>
        )}
      </form>
    </div>
  );
}

/* ---------- 02 Panels ---------- */

function PanelsTab({ st }: { st: JuryState }) {
  const assigned = st.order[1].length + st.order[2].length;
  const [flash, setFlash] = useState(0);
  const [drawing, setDrawing] = useState(false);
  return (
    <>
      <PanelHead title="Two" accent="panels." meta={assigned ? `${assigned} teams split across both panels · order = presentation order` : `${st.teams.length} teams waiting to be assigned`}>
        {assigned > 0 && (
          <button type="button" className="text-link" onClick={() => jury.clearAssignments()}>
            Clear
          </button>
        )}
        <button
          type="button"
          className="button small"
          disabled={drawing || !st.teams.length}
          onClick={() => {
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
              jury.randomAssign();
              setFlash((f) => f + 1);
              return;
            }
            setDrawing(true);
            setTimeout(() => {
              jury.randomAssign();
              setDrawing(false);
              setFlash((f) => f + 1);
            }, 2200);
          }}
        >
          <Icon name="shuffle" size={16} /> {assigned ? 'Shuffle again' : 'Assign teams randomly'}
        </button>
      </PanelHead>
      {drawing && st.teams.length > 0 && <DrawOverlay teams={st.teams} />}
      <div className={`p2-panels${drawing ? ' is-drawing' : ''}`} key={flash}>
        {PANELS.map((p) => {
          const jurors = st.jurors.filter((j) => j.panel === p);
          const other: PanelId = p === 1 ? 2 : 1;
          return (
            <section key={p} className="p2-panelcol">
              <header>
                <span className="p2-panel-no">0{p}</span>
                <div>
                  <h3>{PANEL_NAMES[p]}</h3>
                  <p className="p2-meta">
                    {st.order[p].length} teams · {jurors.length} jurors
                  </p>
                </div>
              </header>
              <ul className="p2-jurorchips">
                {jurors.map((j) => (
                  <li key={j.id}>
                    <span className="p2-initials small" aria-hidden="true">
                      {initials(j.name)}
                    </span>
                    {j.name}
                  </li>
                ))}
                {jurors.length === 0 && <li className="muted">No jurors yet — add them in Jury & logins</li>}
              </ul>
              {st.order[p].length === 0 ? (
                <div className="p2-empty-col">
                  <p>No teams yet</p>
                  <small>Use “Assign teams randomly” to split all {st.teams.length} teams.</small>
                </div>
              ) : (
                <ol className="p2-teamlist">
                  {st.order[p].map((id, i) => {
                    const t = teamById(st, id);
                    return (
                      <li key={id} style={{ animationDelay: `${i * 45}ms` }}>
                        <span className="p2-order">{pad(i + 1)}</span>
                        <div>
                          <strong>{t.title}</strong>
                          <small>
                            {t.code} · {t.college}
                          </small>
                        </div>
                        <button type="button" className="p2-copy" onClick={() => jury.moveTeam(id, other)} title={`Move to ${PANEL_NAMES[other]}`}>
                          → P{other}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

/** Lucky-draw moment while teams are split into panels. */
function DrawOverlay({ teams }: { teams: Team[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => n + 1), 70);
    return () => clearInterval(t);
  }, []);
  const half = Math.ceil(teams.length / 2);
  const dealt = Math.min(teams.length, Math.floor(i / 2.4));
  const p1 = Math.min(half, Math.ceil(dealt / 2));
  const p2 = Math.min(teams.length - half, Math.floor(dealt / 2));
  return (
    <div className="p2-draw" role="status" aria-live="polite">
      <span className="p2-draw-count">
        <small>Panel 1</small>
        <b>{pad(p1)}</b>
      </span>
      <div className="p2-draw-reel">
        <p className="p2-label">Drawing teams</p>
        <div className="p2-draw-window" aria-hidden="true">
          {[-1, 0, 1].map((o) => (
            <span key={o} className={o === 0 ? 'is-mid' : undefined}>
              {teams[(i + o + teams.length) % teams.length].title}
            </span>
          ))}
        </div>
        <span className="p2-draw-bar" aria-hidden="true">
          <span style={{ width: `${(dealt / teams.length) * 100}%` }} />
        </span>
      </div>
      <span className="p2-draw-count">
        <small>Panel 2</small>
        <b>{pad(p2)}</b>
      </span>
    </div>
  );
}

/* ---------- 03 Live timer ---------- */

function LiveTab({ st }: { st: JuryState }) {
  if (!st.order[1].length && !st.order[2].length) {
    return <p className="empty">Assign teams to panels first (Panels tab), then run each panel’s timer here.</p>;
  }
  return (
    <>
      <PanelHead
        title="Live"
        accent="timer."
        meta={`${SLOT.presentSeconds / 60} min presentation + ${SLOT.qaSeconds / 60} min Q&A per team · judges get a beep and a message when each part ends`}
      />
      <div className="p2-panels">
        {PANELS.map((p) => (
          <PanelTimer key={p} st={st} panel={p} />
        ))}
      </div>
    </>
  );
}

function PanelTimer({ st, panel }: { st: JuryState; panel: PanelId }) {
  const session = st.session[panel];
  const [alert, setAlert] = useState('');
  const { phase, elapsed } = usePhaseAlerts(session, (to) =>
    setAlert(to === 'qa' ? 'Presentation over — Q&A started. Judges notified.' : 'Time up — judges notified to finish scoring.'),
  );
  const team = session.teamId ? teamById(st, session.teamId) : null;
  const jurors = st.jurors.filter((j) => j.panel === panel);
  const submitted = team ? Object.keys(st.evals[team.id] ?? {}).filter((id) => jurors.some((j) => j.id === id)).length : 0;
  const order = st.order[panel];
  const idx = team ? order.indexOf(team.id) : -1;

  return (
    <section className={`p2-timerbox is-${phase}`}>
      <header>
        <span className="p2-panel-no">0{panel}</span>
        <div>
          <h3>{PANEL_NAMES[panel]}</h3>
          <p className="p2-meta">{team ? `Team ${idx + 1} of ${order.length}` : `${order.length} teams queued`}</p>
        </div>
        <span className={`p2-phase is-${phase}`}>
          {session.running && <i aria-hidden="true" />}
          {PHASE_LABEL[phase]}
        </span>
      </header>

      <p className="p2-meta p2-qdots-hint">Presentation order — tap a number to jump</p>
      <ol className="p2-qdots" aria-label="Presentation order">
        {order.map((id, i) => {
          const scored = Object.keys(st.evals[id] ?? {}).filter((jid) => jurors.some((j) => j.id === jid)).length;
          const state = id === session.teamId ? 'is-current' : jurors.length && scored >= jurors.length ? 'is-done' : '';
          return (
            <li key={id} className={state || undefined} title={`${pad(i + 1)} · ${teamById(st, id).title}${state === 'is-done' ? ' · scored' : ''}`}>
              <button type="button" onClick={() => jury.selectTeam(panel, id)} aria-label={`Select team ${i + 1}`}>
                {pad(i + 1)}
              </button>
            </li>
          );
        })}
      </ol>

      {!team && order.length > 0 && (
        <button
          type="button"
          className="p2-bigstart"
          onClick={() => {
            unlockAudio();
            jury.selectTeam(panel, order[0]);
            jury.start(panel);
          }}
        >
          <span className="p2-bigstart-icon">
            <Icon name="play" size={26} />
          </span>
          <span>
            <small>Start Team 01</small>
            {teamById(st, order[0]).title}
          </span>
        </button>
      )}

      {team && (
        <>
          <p className="p2-now-team">{team.title}</p>
          <div className="p2-stage-wrap">
            <StageClock phase={phase} elapsed={elapsed} size={280} />
          </div>
          {alert && (
            <p className="p2-alert" role="status">
              <span aria-hidden="true">🔔</span> {alert}
            </p>
          )}
          <div className="p2-timer-controls">
            {session.running ? (
              <button type="button" className="button small outline" onClick={() => jury.pause(panel)}>
                <Icon name="pause" size={14} /> Pause
              </button>
            ) : (
              <button
                type="button"
                className="button small"
                onClick={() => {
                  unlockAudio();
                  setAlert('');
                  jury.start(panel);
                }}
              >
                <Icon name="play" size={14} /> {elapsed > 0 ? 'Resume' : 'Start'}
              </button>
            )}
            <button type="button" className="text-link" onClick={() => (setAlert(''), jury.resetTimer(panel))}>
              <Icon name="reset" size={14} /> Reset
            </button>
            <button type="button" className="text-link" onClick={() => (setAlert(''), jury.next(panel))} disabled={idx >= order.length - 1}>
              <Icon name="next" size={14} /> Next team
            </button>
            <span className="p2-meta p2-submitted">
              {submitted}/{jurors.length} judges scored
            </span>
          </div>
          {order[idx + 1] && (
            <p className="p2-upnext">
              <span>Up next</span> {teamById(st, order[idx + 1]).title}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- 04 Scores & comments ---------- */

function ScoresTab({ st }: { st: JuryState }) {
  const [panel, setPanel] = useState<PanelId>(1);
  const jurors = st.jurors.filter((j) => j.panel === panel);
  const order = st.order[panel];
  return (
    <>
      <PanelHead title="Scores &" accent="comments." meta={`Every judge’s score out of ${MAX_TOTAL} and their remarks`}>
        <div className="p2-seg" role="tablist" aria-label="Panel">
          {PANELS.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={panel === p} onClick={() => setPanel(p)}>
              {PANEL_NAMES[p]}
            </button>
          ))}
        </div>
      </PanelHead>
      {order.length === 0 ? (
        <p className="empty">No teams in {PANEL_NAMES[panel]} yet.</p>
      ) : (
        <ul className="p2-scorecards">
          {order.map((id, i) => {
            const t = teamById(st, id);
            const ev = st.evals[id] ?? {};
            const avg = averageOf(st, id);
            const n = Object.keys(ev).length;
            return (
              <li key={id}>
                <header>
                  <span className="p2-order">{pad(i + 1)}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p className="p2-meta">
                      {t.code} · {t.college}
                    </p>
                  </div>
                  <span className="p2-avg">
                    {n ? avg.toFixed(1) : '—'}
                    <small>avg · {n}/{jurors.length}</small>
                  </span>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Judge</th>
                      {CRITERIA.map((c) => (
                        <th key={c.id} scope="col" title={c.label}>
                          {c.label.split(' ')[0]}
                        </th>
                      ))}
                      <th scope="col">Total</th>
                      <th scope="col">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jurors.map((j) => {
                      const e = ev[j.id];
                      return (
                        <tr key={j.id} className={e ? undefined : 'is-pending'}>
                          <td>{j.name}</td>
                          {CRITERIA.map((c) => (
                            <td key={c.id}>
                              <MiniScale value={e ? e.scores[c.id] : 0} />
                            </td>
                          ))}
                          <td className="mono p2-total-cell">{e ? total(e.scores) : '—'}</td>
                          <td className="p2-comment">{e ? e.comment || <span className="muted">No comment</span> : <span className="muted">Not scored yet</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** The judge's 1–10 boxes, read-only: the chosen point is lit, the ones below it are filled. */
function MiniScale({ value }: { value: number }) {
  return (
    <span className="p2-mini" aria-label={value ? `${value} out of ${MAX_PER_CRITERION}` : 'Not scored'}>
      <span className="p2-mini-boxes" aria-hidden="true">
        {Array.from({ length: MAX_PER_CRITERION }, (_, k) => k + 1).map((v) => (
          <i key={v} className={v === value ? 'is-picked' : v < value ? 'is-filled' : undefined}>
            {v === value ? v : ''}
          </i>
        ))}
      </span>
    </span>
  );
}

/* ---------- 05 Leaderboards + finalists ---------- */

function BoardTab({ st }: { st: JuryState }) {
  return (
    <>
      <PanelHead
        title="Panel"
        accent="leaderboards."
        meta={st.finalsLocked ? `${st.finalists.length} final teams confirmed` : 'Ranked by average jury score · tick the teams that go to the final'}
      >
        {st.finalsLocked ? (
          <button type="button" className="button small outline" onClick={() => jury.setFinalsLocked(false)}>
            Edit finalists
          </button>
        ) : (
          <button type="button" className="button small" disabled={!st.finalists.length} onClick={() => jury.setFinalsLocked(true)}>
            Confirm {st.finalists.length || ''} final teams
          </button>
        )}
      </PanelHead>

      {st.finalists.length > 0 && (
        <div className={`p2-finalists${st.finalsLocked ? ' is-locked' : ''}`}>
          <p className="p2-label">{st.finalsLocked ? 'Final teams · confirmed' : 'Selected for final'}</p>
          <ol>
            {st.finalists.map((id) => (
              <li key={id}>
                {teamById(st, id).title}
                <small>P{st.order[1].includes(id) ? 1 : 2}</small>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="p2-panels">
        {PANELS.map((p) => {
          const judges = st.jurors.filter((judge) => judge.panel === p);
          const ranked = st.order[p]
            .map((id) => ({
              id, avg: averageOf(st, id),
              complete: judges.length > 0 && judges.every((judge) => st.evals[id]?.[judge.id]),
            }))
            .sort((a, b) => Number(b.complete) - Number(a.complete) || b.avg - a.avg);
          const complete = ranked.filter((row) => row.complete);
          return (
            <section key={p} className="p2-panelcol">
              <header>
                <span className="p2-panel-no">0{p}</span>
                <div>
                  <h3>{PANEL_NAMES[p]}</h3>
                  <p className="p2-meta">{complete.length} of {ranked.length} teams scored</p>
                </div>
              </header>
              {complete.length >= 3 && (
                <div className="p2-podium-row" aria-label={`${PANEL_NAMES[p]} top three`}>
                  {[1, 0, 2].map((k) => {
                    const r = ranked[k];
                    return (
                      <div key={r.id} className={`p2-podium-step is-${k + 1}`}>
                        <p className="p2-podium-name">{teamById(st, r.id).title}</p>
                        <span className="p2-podium-score">{r.avg.toFixed(1)}</span>
                        <div className="p2-podium-block">
                          <span>{k + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {ranked.length === 0 ? (
                <div className="p2-empty-col">
                  <p>No teams yet</p>
                </div>
              ) : (
                <ol className="p2-lb">
                  {ranked.map((r, i) => {
                    const t = teamById(st, r.id);
                    const picked = st.finalists.includes(r.id);
                    return (
                      <li key={r.id} className={`${r.complete ? '' : 'is-pending'}${picked ? ' is-picked' : ''}`}>
                        <span className="p2-lb-rank">{r.complete ? pad(i + 1) : '—'}</span>
                        <div>
                          <strong>
                            {t.title}
                            {i === 0 && r.complete && <em className="p2-leading">Leading</em>}
                          </strong>
                          <span className="p2-lb-bar" aria-hidden="true">
                            <span style={{ width: `${(r.avg / MAX_TOTAL) * 100}%` }} />
                          </span>
                        </div>
                        <span className="p2-lb-score">{r.complete ? r.avg.toFixed(1) : '—'}</span>
                        <label className="p2-pick" title={picked ? 'Remove from final' : 'Send to final'}>
                          <input type="checkbox" checked={picked} disabled={st.finalsLocked || !r.complete} onChange={() => jury.toggleFinalist(r.id)} />
                          <span>{picked ? '✓ Final' : 'Final'}</span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
