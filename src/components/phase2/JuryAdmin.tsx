'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/site/Wordmark';
import { Ring } from './Fx';
import { WaveField } from './WaveField';
import { Icon, type IconName } from './Icons';
import {
  CRITERIA,
  MAX_TOTAL,
  PANEL_NAMES,
  SLOT,
  criterionWeightedScore,
  totalWeightedScore,
  type IssuedCredential,
  type IssuedVolunteerCredential,
  type JuryState,
  type PanelId,
} from './jury-types';
import { averageOf, elapsedOf, jury, useJuryConnection } from './juryStore';
import { PHASE_LABEL, clock, remainingOf, unlockAudio, useNow, usePhaseAlerts } from './juryTimer';
import { StageClock } from './StageClock';

const TABS = [
  ['jury', 'Jury roster', 'jury'],
  ['volunteers', 'Stage volunteers', 'timer'],
  ['panels', 'Panel assignments', 'grid'],
  ['live', 'Live stage timer', 'play'],
  ['scores', 'Scores & matrix', 'scores'],
  ['board', 'Leaderboards', 'podium'],
] as const;
type Tab = (typeof TABS)[number][0];

const PANELS: PanelId[] = [1, 2];
const pad = (n: number) => String(n).padStart(2, '0');
const teamById = (st: JuryState, id: string) => st.teams.find((t) => t.id === id)!;

export function JuryAdmin() {
  const { state: st, status, error } = useJuryConnection('admin');
  const [tab, setTab] = useState<Tab>('jury');

  if (status !== 'ready') {
    return (
      <div className="admin-shell">
        <main id="main" className="admin-main">
          <h1>Jury control</h1>
          <p role="status">{status === 'loading' ? 'Checking organiser access…' : error || 'Sign in to the admin dashboard first.'}</p>
          <Link className="button" href="/admin">
            Open admin dashboard
          </Link>
        </main>
      </div>
    );
  }

  const assigned = st.order[1].length + st.order[2].length;
  const evaluated = st.teams.filter((t) => {
    const p = st.order[1].includes(t.id) ? 1 : st.order[2].includes(t.id) ? 2 : null;
    if (!p) return false;
    const need = st.jurors.filter((j) => j.panel === p).length;
    return need > 0 && Object.keys(st.evals[t.id] ?? {}).length >= need;
  }).length;
  const live = PANELS.filter((p) => st.session[p].running).length;
  const volunteersCount = st.volunteers?.length ?? 0;

  const kpis = [
    {
      icon: 'jury' as IconName,
      label: 'Jury members',
      value: st.jurors.length,
      max: st.jurors.length || 1,
      note: `${st.jurors.filter((j) => j.panel === 1).length} in Panel 1 · ${st.jurors.filter((j) => j.panel === 2).length} in Panel 2`,
    },
    {
      icon: 'timer' as IconName,
      label: 'Stage volunteers',
      value: volunteersCount,
      max: Math.max(volunteersCount, 2),
      note: `${(st.volunteers ?? []).filter((v) => v.panel === 1).length} in P1 · ${(st.volunteers ?? []).filter((v) => v.panel === 2).length} in P2`,
    },
    {
      icon: 'grid' as IconName,
      label: 'Teams assigned',
      value: assigned,
      max: st.teams.length || 1,
      note: `of ${st.teams.length} Expo teams`,
    },
    {
      icon: 'check' as IconName,
      label: 'Fully scored',
      value: evaluated,
      max: st.teams.length || 1,
      note: 'all panel jurors submitted',
    },
  ];

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Jury control <em>admin</em>
        </span>
        <LiveChips st={st} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link className="button outline small" href="/volunteer" target="_blank">
            Volunteer timer ↗
          </Link>
          <Link className="button outline small" href="/jury" target="_blank">
            Jury portal ↗
          </Link>
        </div>
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <Link className="text-link" href="/admin">
          Back to organiser dashboard
        </Link>
        <section className="p2-art-hero p2-admin-hero">
          <div className="p2-art-hero-copy">
            <p className="p2-art-kicker">
              Student Project Expo · Jury Management{live ? ` · ${live} panel${live > 1 ? 's' : ''} live` : ''}
            </p>
            <h1>
              Jury <em>control.</em>
            </h1>
            <p>
              Official 7-criteria evaluation rubric (100% total). Panel 1 and Panel 2 isolation with synchronized volunteer timers.
            </p>
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
          {tab === 'volunteers' && <VolunteersTab st={st} />}
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
            <i aria-hidden="true" />
            P{p} · {PHASE_LABEL[ph]} <b>{clock(remainingOf(ph, el))}</b>
          </span>
        );
      })}
    </span>
  );
}

function phaseOf(s: JuryState['session'][PanelId], elapsed: number) {
  if (!s.teamId) return 'idle';
  if (elapsed <= 0 && !s.running) return 'ready';
  if (elapsed < SLOT.presentSeconds) return 'present';
  if (elapsed < SLOT.presentSeconds + SLOT.qaSeconds) return 'qa';
  return 'over';
}

/** 6-step progress line so admins navigate the jury workflow smoothly. */
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
  const done: Record<Tab, boolean> = {
    jury: st.jurors.length >= 2 && PANELS.every((p) => st.jurors.some((j) => j.panel === p)),
    volunteers: (st.volunteers?.length ?? 0) >= 2,
    panels: assigned > 0 && assigned === st.teams.length,
    live: evaluated > 0 && evaluated === st.teams.length,
    scores: evaluated > 0 && evaluated === st.teams.length,
    board: st.finalsLocked,
  };

  return (
    <nav className="p2-slidetabs-wrap" aria-label="Jury Admin Sections">
      <div className="p2-slidetabs" role="tablist">
        {TABS.map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={done[id] ? 'is-done' : undefined}
          >
            <Icon name={icon as IconName} size={16} />
            <span>{label}</span>
            {done[id] && <i className="p2-tab-check" aria-hidden="true">✓</i>}
          </button>
        ))}
      </div>
    </nav>
  );
}

function PanelHead({
  title,
  accent,
  meta,
  children,
}: {
  title: string;
  accent: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
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

/* ---------- 01 Jury & Logins ---------- */

function JuryTab({ st }: { st: JuryState }) {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [panel, setPanel] = useState<PanelId>(2);
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState<IssuedCredential | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  function setPasswordFor(id: string) {
    const juror = st.jurors.find((j) => j.id === id);
    setEditing({ id, value: '' });
    if (juror) setCreated(null);
  }

  async function savePassword(e: FormEvent, id: string) {
    e.preventDefault();
    if (!editing || !editing.value) return;
    const credential = await jury.resetPassword(id, editing.value);
    if (!credential) return;
    setCreated(credential as IssuedCredential);
    setEditing(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const j = await jury.addJuror({
      name: name.trim(),
      designation: designation.trim() || `Jury · ${PANEL_NAMES[panel]}`,
      email: email.trim(),
      panel,
      password,
    });
    if (!j) return;
    setCreated(j as IssuedCredential);
    setName('');
    setDesignation('');
    setEmail('');
    setPassword('');
  }

  return (
    <div className="p2-two">
      <div>
        <PanelHead
          title="Jury"
          accent="members."
          meta={`${st.jurors.length} judges registered · each receives credentials for /jury`}
        />
        <ul className="p2-rows">
          {st.jurors.map((j) => (
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
                <select
                  className="p2-select small"
                  value={j.panel}
                  onChange={(e) => jury.setJurorPanel(j.id, Number(e.target.value) as PanelId)}
                  aria-label={`Panel for ${j.name}`}
                >
                  <option value={1}>Panel 1</option>
                  <option value={2}>Panel 2</option>
                </select>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setPasswordFor(j.id)}
                >
                  Set password
                </button>
                <button type="button" className="text-link p2-danger" onClick={() => jury.removeJuror(j.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {editing && st.jurors.some((j) => j.id === editing.id) && (() => {
          const juror = st.jurors.find((j) => j.id === editing.id)!;
          return (
            <form className="p2-newcred" onSubmit={(e) => savePassword(e, juror.id)}>
              <p>
                <small>Set password</small> {juror.name}
              </p>
              <div className="field wide">
                <label htmlFor="j-set-password">New password for {juror.name}</label>
                <input
                  id="j-set-password"
                  value={editing.value}
                  onChange={(e) => setEditing({ id: juror.id, value: e.target.value })}
                  placeholder="Type any password"
                  autoComplete="new-password"
                  autoFocus
                  required
                />
              </div>
              <div className="p2-newcred-actions">
                <button className="button small" type="submit">
                  Save password
                </button>
                <button type="button" className="text-link" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          );
        })()}
      </div>

      <div>
        <form className="p2-side-form" onSubmit={submit}>
          <p className="p2-label">Add a jury member</p>
          <p className="muted">A login is created immediately. Set your own password, or leave it blank to auto-generate one.</p>
          <div className="field wide">
            <label htmlFor="j-name">Full name</label>
            <input
              id="j-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Rao"
              required
            />
          </div>
          <div className="field wide">
            <label htmlFor="j-desig">Designation</label>
            <input
              id="j-desig"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Professor, CSE Dept"
            />
          </div>
          <div className="field wide">
            <label htmlFor="j-email">Email (optional)</label>
            <input
              id="j-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="judge@college.edu"
            />
          </div>
          <div className="field wide">
            <label htmlFor="j-password">Password (optional)</label>
            <input
              id="j-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type any password, or leave blank to auto-generate"
              autoComplete="new-password"
            />
          </div>
          <div className="field wide">
            <label htmlFor="j-panel">Panel</label>
            <select
              id="j-panel"
              className="p2-select"
              value={panel}
              onChange={(e) => setPanel(Number(e.target.value) as PanelId)}
            >
              <option value={1}>Panel 1</option>
              <option value={2}>Panel 2</option>
            </select>
          </div>
          <button className="button">Add judge &amp; issue login</button>
        </form>

        {created && (
          <div className="p2-issued" role="dialog" aria-label="Issued Judge Credentials">
            <div className="p2-issued-head">
              <h3>Login issued for {created.name}</h3>
              <button type="button" className="text-link" onClick={() => setCreated(null)}>
                Dismiss
              </button>
            </div>
            <p className="muted">Share these details with the judge to log into /jury:</p>
            <dl className="p2-issued-cred">
              <div>
                <dt>Portal URL</dt>
                <dd>
                  <code>/jury</code>
                </dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>
                  <code>{created.username}</code>
                </dd>
              </div>
              <div>
                <dt>Password</dt>
                <dd>
                  <code>{created.password}</code>
                </dd>
              </div>
              <div>
                <dt>Panel</dt>
                <dd>
                  <strong>{PANEL_NAMES[created.panel]}</strong>
                </dd>
              </div>
            </dl>
            <CopyButton
              text={`NEXUS 2026 Jury Login:\nURL: /jury\nUsername: ${created.username}\nPassword: ${created.password}\nPanel: ${PANEL_NAMES[created.panel]}`}
              label="Copy credentials"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 02 Stage Volunteers ---------- */

function VolunteersTab({ st }: { st: JuryState }) {
  const [name, setName] = useState('');
  const [panel, setPanel] = useState<PanelId>(1);
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState<IssuedVolunteerCredential | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<{ id: string; value: string } | null>(null);

  const volunteers = st.volunteers ?? [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = await jury.addVolunteer({ name: name.trim(), panel, password });
    if (!v) return;
    setCreated(v as IssuedVolunteerCredential);
    setName('');
    setPassword('');
  }

  return (
    <div className="p2-two">
      <div>
        <PanelHead
          title="Stage"
          accent="volunteers."
          meta={`${volunteers.length} volunteers · each controls timer for their assigned panel at /volunteer`}
        />
        {volunteers.length === 0 ? (
          <p className="empty">No stage volunteers created yet. Add volunteers using the form on the right.</p>
        ) : (
          <ul className="p2-rows">
            {volunteers.map((v) => (
              <li key={v.id} className="p2-juror">
                <span className="p2-initials" aria-hidden="true">
                  {initials(v.name)}
                  <b>P{v.panel}</b>
                </span>
                <div>
                  <h3>{v.name}</h3>
                  <p className="muted">Volunteer · {PANEL_NAMES[v.panel]}</p>
                  <div className="p2-cred">
                    <span>
                      <small>Username</small> {v.username}
                    </span>
                  </div>
                </div>
                <div className="p2-row-end p2-row-stack">
                  <select
                    className="p2-select small"
                    value={v.panel}
                    onChange={(e) => jury.setVolunteerPanel(v.id, Number(e.target.value) as PanelId)}
                    aria-label={`Panel for volunteer ${v.name}`}
                  >
                    <option value={1}>Panel 1</option>
                    <option value={2}>Panel 2</option>
                  </select>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setEditingVolunteer({ id: v.id, value: '' })}
                  >
                    Set password
                  </button>
                  <button type="button" className="text-link p2-danger" onClick={() => jury.removeVolunteer(v.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editingVolunteer && volunteers.some((v) => v.id === editingVolunteer.id) && (() => {
          const volunteer = volunteers.find((v) => v.id === editingVolunteer.id)!;
          return (
            <form
              className="p2-newcred"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingVolunteer.value) return;
                const credential = await jury.resetVolunteerPassword(volunteer.id, editingVolunteer.value);
                if (!credential) return;
                setCreated(credential as IssuedVolunteerCredential);
                setEditingVolunteer(null);
              }}
            >
              <p>
                <small>Set password</small> {volunteer.name}
              </p>
              <div className="field wide">
                <label htmlFor="v-set-password">New password for {volunteer.name}</label>
                <input
                  id="v-set-password"
                  value={editingVolunteer.value}
                  onChange={(e) => setEditingVolunteer({ id: volunteer.id, value: e.target.value })}
                  placeholder="Type any password"
                  autoComplete="new-password"
                  autoFocus
                  required
                />
              </div>
              <div className="p2-newcred-actions">
                <button className="button small" type="submit">
                  Save password
                </button>
                <button type="button" className="text-link" onClick={() => setEditingVolunteer(null)}>
                  Cancel
                </button>
              </div>
            </form>
          );
        })()}
      </div>

      <div>
        <form className="p2-side-form" onSubmit={submit}>
          <p className="p2-label">Add a stage volunteer</p>
          <p className="muted">
            The volunteer will receive a login to access <strong>/volunteer</strong> to start, pause, resume, reset, and advance the 10-minute timer for their panel. Set your own password, or leave it blank to auto-generate one.
          </p>
          <div className="field wide">
            <label htmlFor="v-name">Volunteer full name</label>
            <input
              id="v-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>
          <div className="field wide">
            <label htmlFor="v-password">Password (optional)</label>
            <input
              id="v-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type any password, or leave blank to auto-generate"
              autoComplete="new-password"
            />
          </div>
          <div className="field wide">
            <label htmlFor="v-panel">Assigned Panel</label>
            <select
              id="v-panel"
              className="p2-select"
              value={panel}
              onChange={(e) => setPanel(Number(e.target.value) as PanelId)}
            >
              <option value={1}>Panel 1</option>
              <option value={2}>Panel 2</option>
            </select>
          </div>
          <button className="button">Add volunteer &amp; issue credentials</button>
        </form>

        {created && (
          <div className="p2-issued" role="dialog" aria-label="Issued Volunteer Credentials">
            <div className="p2-issued-head">
              <h3>Login issued for {created.name}</h3>
              <button type="button" className="text-link" onClick={() => setCreated(null)}>
                Dismiss
              </button>
            </div>
            <p className="muted">Share these details with the volunteer to log into /volunteer:</p>
            <dl className="p2-issued-cred">
              <div>
                <dt>Volunteer URL</dt>
                <dd>
                  <code>/volunteer</code>
                </dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>
                  <code>{created.username}</code>
                </dd>
              </div>
              <div>
                <dt>Password</dt>
                <dd>
                  <code>{created.password}</code>
                </dd>
              </div>
              <div>
                <dt>Assigned Panel</dt>
                <dd>
                  <strong>{PANEL_NAMES[created.panel]}</strong>
                </dd>
              </div>
            </dl>
            <CopyButton
              text={`NEXUS 2026 Volunteer Timer Login:\nURL: /volunteer\nUsername: ${created.username}\nPassword: ${created.password}\nAssigned Panel: ${PANEL_NAMES[created.panel]}`}
              label="Copy credentials"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 03 Panel Assignments ---------- */

function PanelsTab({ st }: { st: JuryState }) {
  const [shuffling, setShuffling] = useState(false);

  function assignRandomly() {
    setShuffling(true);
    setTimeout(() => {
      jury.randomAssign();
      setShuffling(false);
    }, 1200);
  }

  return (
    <>
      <PanelHead
        title="Panel"
        accent="assignments."
        meta={`Split ${st.teams.length} teams across Panel 1 and Panel 2`}
      >
        <button type="button" className="button small" onClick={assignRandomly} disabled={shuffling || !st.teams.length}>
          {shuffling ? 'Assigning…' : 'Shuffle & split evenly'}
        </button>
        <button
          type="button"
          className="button outline small"
          onClick={() => jury.clearAssignments()}
          disabled={!st.order[1].length && !st.order[2].length}
        >
          Clear
        </button>
      </PanelHead>

      <div className="p2-panels">
        {PANELS.map((p) => {
          const other = p === 1 ? 2 : 1;
          const judges = st.jurors.filter((j) => j.panel === p);
          return (
            <section key={p} className="p2-panelcol">
              <header>
                <span className="p2-panel-no">0{p}</span>
                <div>
                  <h3>{PANEL_NAMES[p]}</h3>
                  <p className="p2-meta">
                    {st.order[p].length} teams · {judges.length} judges
                  </p>
                </div>
              </header>
              <ul className="p2-juror-chips">
                {judges.map((j) => (
                  <li key={j.id}>{j.name}</li>
                ))}
              </ul>
              {st.order[p].length === 0 ? (
                <div className="p2-empty-col">
                  <p>No teams assigned yet</p>
                  <small>Use “Shuffle &amp; split evenly” to distribute all {st.teams.length} teams.</small>
                </div>
              ) : (
                <ol className="p2-teamlist">
                  {st.order[p].map((id, i) => {
                    const t = teamById(st, id);
                    return (
                      <li key={id}>
                        <span className="p2-order">{pad(i + 1)}</span>
                        <div>
                          <strong>{t.name ?? t.title}</strong>
                          <small>
                            {t.code} · {t.title}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="p2-copy"
                          onClick={() => jury.moveTeam(id, other)}
                          title={`Move to ${PANEL_NAMES[other]}`}
                        >
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

/* ---------- 04 Live Stage Timer (Admin Override) ---------- */

function LiveTab({ st }: { st: JuryState }) {
  if (!st.order[1].length && !st.order[2].length) {
    return <p className="empty">Assign teams to panels first (Panel assignments tab), then run timers here or via /volunteer.</p>;
  }

  return (
    <>
      <PanelHead
        title="Live Stage"
        accent="timer controls."
        meta="Stage volunteers control timers from /volunteer. Admins retain global override control."
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
    setAlert(
      to === 'qa'
        ? 'Presentation over (5:00) — Q&A started. Alert chime sounded.'
        : 'Time up (10:00) — 10-minute presentation slot completed.'
    )
  );
  const team = session.teamId ? teamById(st, session.teamId) : null;
  const jurors = st.jurors.filter((j) => j.panel === panel);
  const submitted = team
    ? Object.keys(st.evals[team.id] ?? {}).filter((id) => jurors.some((j) => j.id === id)).length
    : 0;
  const order = st.order[panel];
  const idx = team ? order.indexOf(team.id) : -1;

  return (
    <section className={`p2-timerbox is-${phase}`}>
      <header>
        <span className="p2-panel-no">0{panel}</span>
        <div>
          <h3>{PANEL_NAMES[panel]}</h3>
          <p className="p2-meta">
            {team ? `Team ${idx + 1} of ${order.length}` : `${order.length} teams queued`}
            {session.volunteerName ? ` · Stage Vol: ${session.volunteerName}` : ''}
          </p>
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
          const state =
            id === session.teamId ? 'is-current' : jurors.length && scored >= jurors.length ? 'is-done' : '';
          return (
            <li
              key={id}
              className={state || undefined}
              title={`${pad(i + 1)} · ${teamById(st, id).title}${state === 'is-done' ? ' · scored' : ''}`}
            >
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
            {teamById(st, order[0]).name ?? teamById(st, order[0]).title}
          </span>
        </button>
      )}

      {team && (
        <>
          <p className="p2-now-team">{team.name ?? team.title}</p>
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
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setAlert('');
                jury.resetTimer(panel);
              }}
            >
              <Icon name="reset" size={14} /> Reset
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setAlert('');
                jury.next(panel);
              }}
              disabled={idx >= order.length - 1}
            >
              <Icon name="next" size={14} /> Next team
            </button>
            <span className="p2-meta p2-submitted">
              {submitted}/{jurors.length} judges scored
            </span>
          </div>
          {order[idx + 1] && (
            <p className="p2-upnext">
              <span>Up next:</span> {teamById(st, order[idx + 1]).name ?? teamById(st, order[idx + 1]).title}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- 05 Scores & 7-Criteria Matrix ---------- */

function ScoresTab({ st }: { st: JuryState }) {
  const [panel, setPanel] = useState<PanelId>(1);
  const jurors = st.jurors.filter((j) => j.panel === panel);
  const order = st.order[panel];

  return (
    <>
      <PanelHead
        title="Evaluation"
        accent="matrix &amp; scores."
        meta={`Official 7-criteria matrix out of ${MAX_TOTAL} pts. Averages calculated for submitted judges.`}
      >
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
            const submittedJurors = jurors.filter((j) => ev[j.id]);
            const n = submittedJurors.length;

            return (
              <li key={id} className="p2-matrix-card">
                <header>
                  <span className="p2-order">{pad(i + 1)}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p className="p2-meta">
                      {t.code} · {t.college} · {t.members.join(', ')}
                    </p>
                  </div>
                  <div className="p2-team-score-summary">
                    <span className="p2-avg">
                      {n ? avg.toFixed(2) : '—'}
                      <small>
                        / 100 avg ({n}/{jurors.length} judges)
                      </small>
                    </span>
                  </div>
                </header>

                <div className="p2-table-wrap">
                  <table className="p2-matrix-table">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '150px' }}>Judge</th>
                        {CRITERIA.map((c) => (
                          <th key={c.id} scope="col" title={c.label}>
                            <div className="p2-th-crit">
                              <span>{c.shortLabel}</span>
                              <small>{c.weightage}%</small>
                            </div>
                          </th>
                        ))}
                        <th scope="col" style={{ width: '90px' }}>Weighted Total</th>
                        <th scope="col" style={{ minWidth: '220px' }}>Comments &amp; Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jurors.map((j) => {
                        const e = ev[j.id];
                        const totalScore = e ? totalWeightedScore(e.scores) : null;
                        return (
                          <tr key={j.id} className={e ? undefined : 'is-pending'}>
                            <td className="p2-judge-name">
                              <strong>{j.name}</strong>
                              <small className="muted">{j.designation || 'Jury'}</small>
                            </td>
                            {CRITERIA.map((c) => {
                              const mark = e ? e.scores[c.id] : undefined;
                              const weighted = mark !== undefined ? criterionWeightedScore(mark, c.weightage) : null;
                              return (
                                <td key={c.id} className="p2-mark-cell">
                                  {mark !== undefined ? (
                                    <div className="p2-cell-score">
                                      <span className="p2-cell-mark">{mark.toFixed(2)}</span>
                                      <small className="p2-cell-weight">{weighted?.toFixed(2)} pts</small>
                                    </div>
                                  ) : (
                                    <span className="muted">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="mono p2-total-cell">
                              {totalScore !== null ? (
                                <strong>{totalScore.toFixed(2)}</strong>
                              ) : (
                                <span className="muted">Pending</span>
                              )}
                            </td>
                            <td className="p2-comment">
                              {e ? (
                                <p className="p2-comment-text">{e.comment || <span className="muted">No remarks</span>}</p>
                              ) : (
                                <span className="muted">Not scored yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Criteria Averages Row */}
                      {n > 0 && (
                        <tr className="p2-avg-row">
                          <td>
                            <strong>Average ({n} judges)</strong>
                          </td>
                          {CRITERIA.map((c) => {
                            const cAvg =
                              submittedJurors.reduce((acc, j) => acc + (ev[j.id]?.scores[c.id] ?? 0), 0) / n;
                            const wAvg = criterionWeightedScore(cAvg, c.weightage);
                            return (
                              <td key={c.id} className="p2-mark-cell">
                                <div className="p2-cell-score is-avg">
                                  <span className="p2-cell-mark">{cAvg.toFixed(2)}</span>
                                  <small className="p2-cell-weight">{wAvg.toFixed(2)} pts</small>
                                </div>
                              </td>
                            );
                          })}
                          <td className="mono p2-total-cell is-avg">
                            <strong>{avg.toFixed(2)}</strong>
                          </td>
                          <td className="muted">Arithmetic average of submitted scores</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ---------- 06 Leaderboards + Finalists ---------- */

function BoardTab({ st }: { st: JuryState }) {
  return (
    <>
      <PanelHead
        title="Official"
        accent="leaderboards."
        meta={
          st.finalsLocked
            ? `${st.finalists.length} final teams confirmed`
            : 'Ranked by average weighted score out of 100 · select finalist teams for final pitch'
        }
      >
        {st.finalsLocked ? (
          <button type="button" className="button small outline" onClick={() => jury.setFinalsLocked(false)}>
            Unlock finalists
          </button>
        ) : (
          <button
            type="button"
            className="button small"
            disabled={!st.finalists.length}
            onClick={() => jury.setFinalsLocked(true)}
          >
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
            .map((id) => {
              const evals = st.evals[id] ?? {};
              const submittedCount = Object.keys(evals).filter((jid) => judges.some((j) => j.id === jid)).length;
              return {
                id,
                avg: averageOf(st, id),
                submittedCount,
                complete: judges.length > 0 && submittedCount === judges.length,
              };
            })
            .sort((a, b) => Number(b.complete) - Number(a.complete) || b.avg - a.avg);

          const complete = ranked.filter((row) => row.complete);

          return (
            <section key={p} className="p2-panelcol">
              <header>
                <span className="p2-panel-no">0{p}</span>
                <div>
                  <h3>{PANEL_NAMES[p]}</h3>
                  <p className="p2-meta">
                    {complete.length} of {ranked.length} teams fully scored
                  </p>
                </div>
              </header>

              {ranked.length === 0 ? (
                <div className="p2-empty-col">
                  <p>No teams assigned yet</p>
                </div>
              ) : (
                <ol className="p2-lb">
                  {ranked.map((r, i) => {
                    const t = teamById(st, r.id);
                    const picked = st.finalists.includes(r.id);
                    return (
                      <li key={r.id} className={`${r.complete ? '' : 'is-pending'}${picked ? ' is-picked' : ''}`}>
                        <span className="p2-lb-rank">{r.complete ? pad(i + 1) : '—'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>
                            {t.title}
                            {i === 0 && r.complete && <em className="p2-leading">Leading</em>}
                          </strong>
                          <p className="p2-meta" style={{ margin: '2px 0 4px', fontSize: '11px' }}>
                            {t.code} · {t.college} · {r.submittedCount}/{judges.length} judges
                          </p>
                          <span className="p2-lb-bar" aria-hidden="true">
                            <span style={{ width: `${Math.min(100, (r.avg / MAX_TOTAL) * 100)}%` }} />
                          </span>
                        </div>
                        <span className="p2-lb-score">{r.submittedCount > 0 ? r.avg.toFixed(2) : '—'}</span>
                        <label className="p2-pick" title={picked ? 'Remove from final' : 'Send to final'}>
                          <input
                            type="checkbox"
                            checked={picked}
                            disabled={st.finalsLocked || !r.complete}
                            onChange={() => jury.toggleFinalist(r.id)}
                          />
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
