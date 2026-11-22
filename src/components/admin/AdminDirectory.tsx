'use client';

import { useEffect, useState } from 'react';
import { api } from './types';

type Entry = {
  registrationId: string; code: string; college: string; chapter?: string; presenter?: string;
  name?: string; department?: string; year?: number; email?: string; phone?: string;
};

export function AdminDirectory({ kind, onOpen }: { kind: 'showcase' | 'representatives'; onOpen: (id: string) => void }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const isShowcase = kind === 'showcase';
  const label = isShowcase ? 'Chapter Showcase' : 'Student representatives';

  useEffect(() => {
    const controller = new AbortController();
    api<Entry[]>(kind, { signal: controller.signal })
      .then(setEntries)
      .catch(() => {
        if (!controller.signal.aborted) setError(`Could not load ${label.toLowerCase()}. Reopen this tab to try again.`);
      });
    return () => controller.abort();
  }, [kind, label]);

  const search = query.trim().toLowerCase();
  const filtered = entries?.filter(({ college, code, chapter, presenter, name, department, email }) =>
    [college, code, chapter, presenter, name, department, email].join(' ').toLowerCase().includes(search));

  return (
    <section aria-label={label}>
      <div className="admin-tools">
        <label className="admin-search">
          <span className="sr-only">Search {label.toLowerCase()}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, college or registration ID" />
        </label>
        <a className="button outline small" href={`/api/admin/${kind}/export`} download>Export CSV</a>
      </div>
      {error ? <p className="form-alert" role="alert">{error}</p> : !filtered ? <p role="status">Loading {label.toLowerCase()}…</p> :
        filtered.length === 0 ? <p className="empty">No matching {label.toLowerCase()} entries.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th scope="col">{isShowcase ? 'Presenter' : 'Student'}</th>
                <th scope="col">College</th>
                <th scope="col">{isShowcase ? 'CSI branch' : 'Department and year'}</th>
                {!isShowcase && <th scope="col">Contact</th>}
                <th scope="col">Registration</th>
              </tr></thead>
              <tbody>{filtered.map((entry) => (
                <tr key={isShowcase ? entry.registrationId : `${entry.registrationId}:${entry.email}`}>
                  <td><strong>{entry.presenter || entry.name}</strong></td>
                  <td>{entry.college}</td>
                  <td>{isShowcase ? entry.chapter || '—' : `${entry.department} · Year ${entry.year}`}</td>
                  {!isShowcase && <td>{entry.email}<small>{entry.phone}</small></td>}
                  <td><button type="button" className="link-button" onClick={() => onOpen(entry.registrationId)}>{entry.code}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
    </section>
  );
}
