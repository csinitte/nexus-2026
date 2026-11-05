'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { EXPO_PROJECT_CATEGORIES, EXPO_REVIEW_STATUSES } from '@/lib/nexus/constants';
import { Wordmark } from '@/components/site/Wordmark';
import { RegistrationDetailPanel } from './RegistrationDetailPanel';
import { api, type AdminUser, type ExpoProject, type Overview, type Registration, type RegistrationDetail } from './types';

type Tab = 'registrations' | 'expo';
type Status = 'checking' | 'signed-out' | 'ready';

export function AdminDashboard() {
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<Registration[]>([]);
  const [projects, setProjects] = useState<ExpoProject[]>([]);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<Tab>('registrations');
  const [detail, setDetail] = useState<RegistrationDetail | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [me, o, r, p] = await Promise.all([
        api<{ user: AdminUser }>('auth/me'),
        api<Overview>('overview'),
        api<Registration[]>('registrations'),
        api<ExpoProject[]>('expo'),
      ]);
      setUser(me.user);
      setOverview(o);
      setRows(r.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))));
      setProjects(p);
      setStatus('ready');
    } catch (e) {
      if ((e as { status?: number }).status === 401) setStatus('signed-out');
      else setLoadError(e instanceof Error ? e.message : 'Could not load the dashboard.');
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const openDetail = useCallback(async (id: string) => {
    try {
      setDetail(await api<RegistrationDetail>(`registrations/${id}`));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not open the registration.');
    }
  }, []);

  const signOut = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setUser(null);
    setDetail(null);
    setStatus('signed-out');
  };

  if (status === 'signed-out') return <SignIn onSignedIn={load} />;
  if (status === 'checking')
    return (
      <div className="admin-shell admin-loading" role="status">
        {loadError ? (
          <>
            <p className="form-alert">{loadError}</p>
            <button className="button" type="button" onClick={load}>
              Try again
            </button>
          </>
        ) : (
          <p>Loading dashboard…</p>
        )}
      </div>
    );

  const canEdit = user?.role === 'admin' || user?.role === 'coordinator';
  const stats: [string, number | undefined][] = [
    ['College registrations', overview?.totalCollegeRegistrations],
    ['Registered delegations', overview?.totalRegisteredDelegations],
    ['Student representatives', overview?.totalStudentRepresentatives],
    ['Accompanying faculty', overview?.totalAccompanyingFacultyCoordinators],
    ['Showcase entries', overview?.totalChapterShowcaseEntries],
    ['Expo projects', overview?.totalExpoProjects],
    ['Accommodation requests', overview?.totalAccommodationRequests],
  ];

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Organiser dashboard · {user?.email} <em>{user?.role}</em>
        </span>
        <button type="button" className="button outline small" onClick={signOut}>
          Sign out
        </button>
      </header>
      <main id="main" className="admin-main" tabIndex={-1}>
        <div className="admin-title">
          <div>
            <p className="eyebrow">NEXUS 2026 / Admin</p>
            <h1>Summit overview</h1>
          </div>
          <a className="button" href="/api/admin/registrations/export" download>
            Export registrations (CSV) <span aria-hidden="true">↓</span>
          </a>
        </div>
        {loadError && (
          <p className="form-alert" role="alert">
            {loadError}
          </p>
        )}
        <ul className="admin-stats">
          {stats.map(([label, value]) => (
            <li key={label}>
              <small>{label}</small>
              <strong>{value ?? '—'}</strong>
            </li>
          ))}
        </ul>

        <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
          {(['registrations', 'expo'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'is-active' : undefined}
              onClick={() => {
                setTab(t);
                setDetail(null);
              }}
            >
              {t === 'registrations' ? `Registrations (${rows.length})` : `Expo projects (${projects.length})`}
            </button>
          ))}
        </div>

        {tab === 'registrations' ? (
          <RegistrationsTable rows={rows} onOpen={openDetail} canEdit={canEdit} onChanged={load} />
        ) : (
          <ExpoTable projects={projects} rows={rows} canEdit={canEdit} onChanged={load} onOpen={openDetail} />
        )}

        {detail && (
          <RegistrationDetailPanel
            key={detail.registration.id}
            detail={detail}
            canEdit={canEdit}
            onClose={() => setDetail(null)}
            onSaved={async () => {
              await load();
              await openDetail(detail.registration.id);
            }}
          />
        )}
      </main>
    </div>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword('');
      await onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-shell admin-login">
      <header className="form-top">
        <Wordmark />
      </header>
      <main id="main" tabIndex={-1}>
        <div className="form-intro">
          <p className="eyebrow">Organising team</p>
          <h1>
            Welcome <em>back.</em>
          </h1>
          <p className="muted">Sign in to manage NEXUS registrations and Expo projects.</p>
        </div>
        <form className="step-form" onSubmit={submit}>
          <div className="fields">
            <div className="field wide">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field wide">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <div className="step-actions">
            <span />
            <button className="button" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function RegistrationsTable({
  rows,
  onOpen,
  canEdit,
  onChanged,
}: {
  rows: Registration[];
  onOpen: (id: string) => void;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => (!q || `${r.collegeName} ${r.registrationCode}`.toLowerCase().includes(q)) && (!status || r.registrationStatus === status),
    );
  }, [rows, query, status]);

  const verify = async (id: string) => {
    setBusyId(id);
    try {
      await api(`registrations/${id}`, { method: 'PATCH', body: JSON.stringify({ registrationStatus: 'verified' }) });
      await onChanged();
    } finally {
      setBusyId('');
    }
  };

  return (
    <section aria-label="Registrations">
      <div className="admin-tools">
        <label className="admin-search">
          <span className="sr-only">Search by college name or registration ID</span>
          <input type="search" placeholder="Search college or NEXUS26-…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">College</th>
              <th scope="col">Coordinator</th>
              <th scope="col">People</th>
              <th scope="col">Expo</th>
              <th scope="col">Stay</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.registrationCode}</td>
                <td>
                  <strong>{r.collegeName}</strong>
                  <small>{r.city}</small>
                </td>
                <td>
                  {r.facultyCoordinatorName}
                  <small>{r.facultyCoordinatorEmail}</small>
                </td>
                <td>{r.totalRepresentatives}</td>
                <td>{r.participatingInExpo ? 'Yes' : '—'}</td>
                <td>{r.accommodationRequired ? 'Yes' : '—'}</td>
                <td>
                  <span className={`status status-${r.registrationStatus}`}>{r.registrationStatus}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {canEdit && r.registrationStatus === 'submitted' && (
                      <button type="button" className="link-button" disabled={busyId === r.id} onClick={() => verify(r.id)}>
                        {busyId === r.id ? 'Verifying…' : 'Verify ✓'}
                      </button>
                    )}
                    <button type="button" className="link-button" onClick={() => onOpen(r.id)}>
                      View<span className="sr-only"> {r.collegeName}</span> ↗
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="empty">{rows.length ? 'No registrations match your search.' : 'No registrations yet.'}</p>}
      </div>
    </section>
  );
}

function ExpoTable({
  projects,
  rows,
  canEdit,
  onChanged,
  onOpen,
}: {
  projects: ExpoProject[];
  rows: Registration[];
  canEdit: boolean;
  onChanged: () => Promise<void>;
  onOpen: (id: string) => void;
}) {
  const [category, setCategory] = useState('');
  const [review, setReview] = useState('');
  const colleges = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const filtered = projects.filter((p) => (!category || p.category === category) && (!review || p.reviewStatus === review));
  const csv = `/api/admin/expo?format=csv${category ? `&category=${encodeURIComponent(category)}` : ''}`;

  const save = async (id: string, patch: Partial<Pick<ExpoProject, 'reviewStatus' | 'internalRemarks'>>) => {
    await api(`expo/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    await onChanged();
  };

  return (
    <section aria-label="Expo projects">
      <div className="admin-tools">
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {EXPO_PROJECT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by review status</span>
          <select value={review} onChange={(e) => setReview(e.target.value)}>
            <option value="">All review statuses</option>
            {EXPO_REVIEW_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <a className="text-link" href={csv} download>
          Export CSV <span aria-hidden="true">↓</span>
        </a>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">{projects.length ? 'No projects match these filters.' : 'No projects have been submitted yet.'}</p>
      ) : (
        <ul className="project-list">
          {filtered.map((p) => {
            const college = colleges.get(p.registrationId);
            return (
              <li key={p.id} className="project-row">
                <div>
                  <p className="eyebrow">{p.category}</p>
                  <h3>{p.projectTitle}</h3>
                  <p className="muted">
                    {college ? `${college.collegeName} · ${college.registrationCode}` : 'Unknown college'}
                    {college && (
                      <>
                        {' · '}
                        <button type="button" className="link-button" onClick={() => onOpen(college.id)}>
                          Team & details
                        </button>
                      </>
                    )}
                  </p>
                  <p className="project-desc">{p.description}</p>
                  <a className="text-link" href={`/api/admin/expo/${p.id}/abstract`}>
                    Download abstract PDF <span aria-hidden="true">↓</span>
                  </a>
                </div>
                <div className="project-review">
                  <label>
                    Review status
                    <select value={p.reviewStatus} disabled={!canEdit} onChange={(e) => save(p.id, { reviewStatus: e.target.value })}>
                      {EXPO_REVIEW_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Internal remarks
                    <textarea
                      defaultValue={p.internalRemarks ?? ''}
                      disabled={!canEdit}
                      placeholder={canEdit ? 'Add a note (saved when you leave the field)' : 'No remarks'}
                      onBlur={(e) => e.target.value !== (p.internalRemarks ?? '') && save(p.id, { internalRemarks: e.target.value })}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
