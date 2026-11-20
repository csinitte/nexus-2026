'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { EXPO_PROJECT_CATEGORIES, type ExpoProjectCategory } from '@/lib/nexus/constants';
import { Wordmark } from '@/components/site/Wordmark';
import { PreviewBanner } from './PreviewBanner';
import { Num, Ring, SlideTabs } from './Fx';
import {
  ASSIGNMENTS,
  ATTENDANCE,
  CATEGORY_COUNTS,
  CERT_BATCHES,
  CRITERIA,
  JURORS,
  LIVE_UPDATES,
  MAX_TOTAL,
  PROJECTS,
  SCORES,
  rankProjects,
  type Juror,
  type LiveUpdate,
} from './mock';

const TABS = [
  ['jury', 'Jury'],
  ['assign', 'Assignments'],
  ['scores', 'Scores'],
  ['attendance', 'Attendance'],
  ['certificates', 'Certificates'],
  ['analytics', 'Analytics'],
  ['live', 'Live updates'],
] as const;

type Tab = (typeof TABS)[number][0];
const pad = (n: number) => String(n).padStart(2, '0');

export function Phase2Dashboard() {
  const [tab, setTab] = useState<Tab>('jury');
  const [jurors, setJurors] = useState<Juror[]>(JURORS);
  const [assign, setAssign] = useState<Record<string, string[]>>(ASSIGNMENTS);
  const [attendance, setAttendance] = useState(ATTENDANCE);
  const [updates, setUpdates] = useState<LiveUpdate[]>(LIVE_UPDATES);

  const ranked = useMemo(() => rankProjects(), []);
  const scored = ranked.filter((p) => p.scored > 0 && p.scored >= p.assigned).length;
  const present = attendance.reduce((a, r) => a + r.checkedIn, 0);
  const expected = attendance.reduce((a, r) => a + r.expected, 0);

  const certsReady = CERT_BATCHES.filter((b) => b.status === 'Generated').reduce((a, b) => a + b.count, 0);
  const certsTotal = CERT_BATCHES.reduce((a, b) => a + b.count, 0);
  const activeJurors = jurors.filter((j) => j.status === 'active').length;
  const kpis: { label: string; value: number; max: number; note: string }[] = [
    { label: 'Checked in', value: present, max: expected, note: `of ${expected} delegates` },
    { label: 'Projects scored', value: scored, max: PROJECTS.length, note: `of ${PROJECTS.length} projects` },
    { label: 'Jurors active', value: activeJurors, max: jurors.length, note: `of ${jurors.length} invited` },
    { label: 'Certificates ready', value: certsReady, max: certsTotal, note: `of ${certsTotal} to issue` },
  ];

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Event day console <em>admin</em>
        </span>
        <Link className="button outline small" href="/admin">
          Registrations
        </Link>
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        <PreviewBanner />
        <header className="page-intro p2-console-intro">
          <div className="section-label">
            <span>Organiser / 25 November 2026</span>
            <span>Phase 2</span>
          </div>
          <div className="p2-console-title">
            <h1>
              Event day <em>console.</em>
            </h1>
            <Link className="text-link" href="/jury">
              Open jury portal <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        <dl className="p2-kpis">
          {kpis.map((k) => (
            <div key={k.label}>
              <Ring value={k.value} max={k.max} size={58}>
                {Math.round((k.value / (k.max || 1)) * 100)}%
              </Ring>
              <div>
                <dt>{k.label}</dt>
                <dd>
                  <Num value={k.value} />
                </dd>
                <p className="p2-meta">{k.note}</p>
              </div>
            </div>
          ))}
        </dl>

        <SlideTabs tabs={TABS} value={tab} onChange={setTab} label="Event day sections" />

        <section key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p2-panel">
          {tab === 'jury' && <JuryTab jurors={jurors} assign={assign} onAdd={(j) => setJurors((all) => [...all, j])} />}
          {tab === 'assign' && <AssignTab jurors={jurors} assign={assign} setAssign={setAssign} />}
          {tab === 'scores' && <ScoresTab />}
          {tab === 'attendance' && (
            <AttendanceTab
              rows={attendance}
              onCheckIn={(code) =>
                setAttendance((rows) => rows.map((r) => (r.code === code ? { ...r, checkedIn: r.expected, time: r.time ?? nowLabel() } : r)))
              }
            />
          )}
          {tab === 'certificates' && <CertificatesTab />}
          {tab === 'analytics' && <AnalyticsTab present={present} expected={expected} scored={scored} />}
          {tab === 'live' && <LiveTab updates={updates} onPost={(u) => setUpdates((all) => [u, ...all])} />}
        </section>
      </main>
    </div>
  );
}

function nowLabel() {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
}

function PanelHead({ title, accent, meta, children }: { title: string; accent: string; meta?: React.ReactNode; children?: React.ReactNode }) {
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

/* ---------- Jury ---------- */

function JuryTab({ jurors, assign, onAdd }: { jurors: Juror[]; assign: Record<string, string[]>; onAdd: (j: Juror) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [cats, setCats] = useState<ExpoProjectCategory[]>([]);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!cats.length) return setError('Pick at least one category.');
    if (jurors.some((j) => j.email.toLowerCase() === email.trim().toLowerCase())) return setError('A juror with this email already exists.');
    onAdd({ id: `j${Date.now()}`, name: name.trim(), email: email.trim(), designation: designation.trim(), categories: cats, status: 'invited' });
    setSent(email.trim());
    setName('');
    setEmail('');
    setDesignation('');
    setCats([]);
    setError('');
  }

  const load = (id: string) => Object.values(assign).filter((ids) => ids.includes(id)).length;

  return (
    <div className="p2-two">
      <div>
        <PanelHead title="Jury" accent="panel." meta={`${jurors.length} jurors · ${jurors.filter((j) => j.status === 'invited').length} invite pending`} />
        <ul className="p2-rows">
          {jurors.map((j) => (
            <li key={j.id} className="p2-juror">
              <span className="p2-initials" aria-hidden="true">
                {j.name
                  .split(' ')
                  .filter((w) => /^[a-z]/i.test(w))
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                <b>{j.id.replace(/\D/g, '').slice(-2).padStart(2, '0')}</b>
              </span>
              <div>
                <h3>{j.name}</h3>
                <p className="muted">
                  {j.designation} · {j.email}
                </p>
                <p className="p2-meta">{j.categories.join(' · ')}</p>
              </div>
              <div className="p2-row-end">
                <span className={`p2-tag${j.status === 'active' ? ' is-on' : ''}`}>{j.status === 'active' ? 'Active' : 'Invited'}</span>
                <span className="p2-meta">{load(j.id)} projects</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form className="p2-side-form" onSubmit={submit}>
        <p className="p2-label">Invite a juror</p>
        <p className="muted">They get an email with a code to set up their jury account.</p>
        <div className="field wide">
          <label htmlFor="j-name">Full name</label>
          <input id="j-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field wide">
          <label htmlFor="j-email">Email</label>
          <input id="j-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field wide">
          <label htmlFor="j-desig">Designation & organisation</label>
          <input id="j-desig" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
        </div>
        <fieldset className="p2-chipset">
          <legend>Categories they can judge</legend>
          {EXPO_PROJECT_CATEGORIES.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={cats.includes(c)} onChange={(e) => setCats((all) => (e.target.checked ? [...all, c] : all.filter((x) => x !== c)))} />
              <span>{c}</span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        {sent && !error && <p className="p2-ok">Invite queued for {sent} (preview — no email sent).</p>}
        <button className="button">
          Send invite <span aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  );
}

/* ---------- Assignments ---------- */

function AssignTab({
  jurors,
  assign,
  setAssign,
}: {
  jurors: Juror[];
  assign: Record<string, string[]>;
  setAssign: (fn: (a: Record<string, string[]>) => Record<string, string[]>) => void;
}) {
  const [category, setCategory] = useState('');
  const rows = PROJECTS.filter((p) => !category || p.category === category);
  const toggle = (pid: string, jid: string) =>
    setAssign((a) => {
      const cur = a[pid] ?? [];
      return { ...a, [pid]: cur.includes(jid) ? cur.filter((x) => x !== jid) : [...cur, jid] };
    });
  const unassigned = PROJECTS.filter((p) => !(assign[p.id] ?? []).length).length;

  return (
    <>
      <PanelHead title="Who judges" accent="what." meta={unassigned ? `${unassigned} project(s) without a juror` : 'Every project has at least one juror'}>
        <label>
          <span className="sr-only">Filter by category</span>
          <select className="p2-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {EXPO_PROJECT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </PanelHead>
      <div className="table-wrap p2-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Table</th>
              <th scope="col">Project</th>
              {jurors.map((j) => (
                <th key={j.id} scope="col">
                  {j.name.replace('Mock ', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p2-td-table">{p.table.slice(1)}</td>
                <td>
                  <strong>{p.title}</strong>
                  <small>{p.category}</small>
                </td>
                {jurors.map((j) => {
                  const on = (assign[p.id] ?? []).includes(j.id);
                  const fits = j.categories.includes(p.category);
                  return (
                    <td key={j.id}>
                      <button
                        type="button"
                        className={`p2-assign${on ? ' is-on' : ''}${fits ? '' : ' is-off'}`}
                        aria-pressed={on}
                        aria-label={`Assign ${j.name} to ${p.title}`}
                        title={fits ? undefined : 'Outside this juror’s categories'}
                        onClick={() => toggle(p.id, j.id)}
                      >
                        {on ? '✓ Assigned' : '+ Assign'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="p2-foot-note">Dashed buttons are outside that juror’s chosen categories.</p>
    </>
  );
}

/* ---------- Scores ---------- */

function ScoresTab() {
  const ranked = rankProjects();
  const [published, setPublished] = useState(false);
  const pending = ranked.filter((p) => p.scored < p.assigned).length;

  return (
    <>
      <PanelHead title="Live" accent="leaderboard." meta={`Average of assigned jurors, out of ${MAX_TOTAL} · ${CRITERIA.length} criteria`}>
        {published && (
          <Link className="text-link" href="/results">
            View results page <span aria-hidden="true">↗</span>
          </Link>
        )}
        <button
          type="button"
          className={published ? 'button outline small' : 'button small'}
          disabled={pending > 0 && !published}
          onClick={() => setPublished((v) => !v)}
        >
          {published ? 'Unpublish' : pending ? `${pending} still scoring` : 'Publish results'}
        </button>
      </PanelHead>
      <ol className="p2-board">
        {ranked.map((p, i) => {
          const done = p.scored > 0 && p.scored >= p.assigned;
          return (
            <li key={p.id} className={`${done ? '' : 'is-pending'}${done && i < 3 ? ` is-top is-top-${i + 1}` : ''}`.trim() || undefined}>
              <span className="p2-board-rank">{done ? pad(i + 1) : '—'}</span>
              <div>
                <h3>{p.title}</h3>
                <p className="muted">
                  {p.college} · {p.category}
                </p>
              </div>
              <span className="p2-meta">
                {p.scored}/{p.assigned} jurors
              </span>
              <span className="p2-board-score">
                {p.scored ? <Num value={p.average} decimals={1} /> : '—'}
                <span className="p2-board-bar" aria-hidden="true">
                  <span style={{ width: `${(p.average / MAX_TOTAL) * 100}%` }} />
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ---------- Attendance ---------- */

function AttendanceTab({ rows, onCheckIn }: { rows: typeof ATTENDANCE; onCheckIn: (code: string) => void }) {
  const [q, setQ] = useState('');
  const filtered = rows.filter((r) => `${r.code} ${r.college}`.toLowerCase().includes(q.trim().toLowerCase()));
  const arrived = rows.filter((r) => r.checkedIn > 0).length;
  return (
    <>
      <PanelHead title="Who's" accent="here." meta={`${arrived} of ${rows.length} delegations arrived`}>
        <Ring value={arrived} max={rows.length} size={52}>
          {arrived}/{rows.length}
        </Ring>
        <label className="p2-search">
          <span className="sr-only">Search by college or registration ID</span>
          <input type="search" placeholder="Search college or NEXUS26-…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </PanelHead>
      <ul className="p2-rows">
        {filtered.map((r) => {
          const state = r.checkedIn === 0 ? 'none' : r.checkedIn < r.expected ? 'part' : 'all';
          return (
            <li key={r.code} className={`p2-attend is-${state}`}>
              <span className="p2-attend-count">
                {r.checkedIn}
                <small>/{r.expected}</small>
              </span>
              <div>
                <h3>{r.college}</h3>
                <p className="p2-meta">
                  {r.code} · {r.time ? `In at ${r.time}` : 'Not arrived'}
                </p>
              </div>
              <div className="p2-row-end">
                {state === 'all' ? (
                  <span className="p2-tag is-on">All here</span>
                ) : (
                  <button type="button" className="button small" onClick={() => onCheckIn(r.code)}>
                    Check in {state === 'part' ? 'rest' : 'all'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && <p className="empty">No delegations match your search.</p>}
    </>
  );
}

/* ---------- Certificates ---------- */

function CertificatesTab() {
  const [batches, setBatches] = useState(CERT_BATCHES);
  return (
    <>
      <PanelHead title="Certificate" accent="batches." meta="Participants download theirs with their registration ID">
        <Link className="text-link" href="/certificates">
          Open certificate page <span aria-hidden="true">↗</span>
        </Link>
      </PanelHead>
      <ul className="p2-rows">
        {batches.map((b, i) => (
          <li key={b.kind} className="p2-batch">
            <span className="p2-batch-no">{pad(i + 1)}</span>
            <div>
              <h3>{b.kind}</h3>
              <p className="p2-meta">{b.count} recipients</p>
            </div>
            <div className="p2-row-end">
              <span className={`p2-tag${b.status === 'Generated' ? ' is-on' : b.status === 'Draft' ? ' is-warn' : ''}`}>{b.status}</span>
              {b.status !== 'Generated' ? (
                <button
                  type="button"
                  className="button small"
                  onClick={() => setBatches((all) => all.map((x) => (x.kind === b.kind ? { ...x, status: 'Generated' } : x)))}
                >
                  Generate
                </button>
              ) : (
                <button type="button" className="button outline small" disabled title="Available once the backend is connected">
                  Download ZIP
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Analytics ---------- */

function Bars({ items }: { items: { label: string; value: number; max: number; display?: string }[] }) {
  return (
    <ul className="p2-bars">
      {items.map((it) => (
        <li key={it.label}>
          <span>{it.label}</span>
          <strong>{it.display ?? it.value}</strong>
          <span className="p2-bar" aria-hidden="true">
            <span style={{ width: `${it.max ? (it.value / it.max) * 100 : 0}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsTab({ present, expected, scored }: { present: number; expected: number; scored: number }) {
  const maxCat = Math.max(...CATEGORY_COUNTS.map((c) => c.count));
  const avgBy = CRITERIA.map((c) => {
    const vals = PROJECTS.flatMap((p) => Object.values(SCORES[p.id] ?? {}).map((s) => s[c.id]));
    return { label: c.label, value: vals.reduce((a, v) => a + v, 0) / (vals.length || 1) };
  });
  return (
    <>
      <PanelHead title="The day in" accent="numbers." meta="Updates as jurors and the help desk submit" />
      <div className="p2-two p2-analytics">
        <section>
          <p className="p2-label">Event day</p>
          <Bars
            items={[
              { label: 'Attendance', value: present, max: expected, display: `${Math.round((present / expected) * 100)}%` },
              { label: 'Projects fully scored', value: scored, max: PROJECTS.length, display: `${scored}/${PROJECTS.length}` },
            ]}
          />
          <p className="p2-label">Average by criterion · out of 10</p>
          <Bars items={avgBy.map((a) => ({ label: a.label, value: a.value, max: 10, display: a.value.toFixed(1) }))} />
        </section>
        <section>
          <p className="p2-label">Expo projects by category</p>
          <Bars items={CATEGORY_COUNTS.map((c) => ({ label: c.category, value: c.count, max: maxCat }))} />
        </section>
      </div>
    </>
  );
}

/* ---------- Live updates ---------- */

function LiveTab({ updates, onPost }: { updates: LiveUpdate[]; onPost: (u: LiveUpdate) => void }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState<LiveUpdate['tag']>('Notice');
  const [pinned, setPinned] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onPost({ id: `u${Date.now()}`, time: nowLabel(), tag, text: text.trim(), pinned });
    setText('');
    setPinned(false);
  }

  return (
    <div className="p2-two">
      <div>
        <PanelHead title="Posted" accent="updates." meta={`${updates.length} posts · newest first`}>
          <Link className="text-link" href="/live">
            Open live page <span aria-hidden="true">↗</span>
          </Link>
        </PanelHead>
        <ol className="p2-updates p2-updates-compact">
          {updates.map((u) => (
            <li key={u.id} className={u.pinned ? 'is-pinned' : undefined}>
              <time>{u.time}</time>
              <div>
                <p className="p2-label">
                  {u.pinned ? 'Pinned' : u.tag}
                  {u.pinned && <span> · {u.tag}</span>}
                </p>
                <p>{u.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <form className="p2-side-form" onSubmit={submit}>
        <p className="p2-label">Post an update</p>
        <div className="p2-chipset p2-chipset-radio" role="radiogroup" aria-label="Type">
          {(['Now', 'Notice', 'Venue', 'Results'] as const).map((t) => (
            <label key={t}>
              <input type="radio" name="u-tag" checked={tag === t} onChange={() => setTag(t)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        <div className="field wide">
          <label htmlFor="u-text">Message</label>
          <textarea id="u-text" maxLength={280} value={text} onChange={(e) => setText(e.target.value)} required />
          <span className="field-hint">{280 - text.length} characters left</span>
        </div>
        <label className="p2-check">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to the top of the live page
        </label>
        <button className="button">
          Post update <span aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  );
}
