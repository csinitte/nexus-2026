'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ARRIVAL_LABELS, type RegistrationDetail } from './types';

const TEXT_FIELDS = [
  ['collegeName', 'College name'],
  ['csiChapterName', 'CSI chapter name'],
  ['csiChapterId', 'CSI chapter ID'],
  ['city', 'City'],
  ['facultyCoordinatorName', 'Coordinator name'],
  ['facultyCoordinatorEmail', 'Coordinator email'],
  ['facultyCoordinatorContact', 'Coordinator contact'],
] as const;

export function RegistrationDetailPanel({
  detail,
  canEdit,
  onClose,
  onSaved,
}: {
  detail: RegistrationDetail;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const r = detail.registration;
  const [editing, setEditing] = useState(false);
  const [accommodation, setAccommodation] = useState(r.accommodationRequired);
  const [names, setNames] = useState<string[]>(r.accommodationParticipantNames);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const team = new Set(detail.teamMembers.map((m) => m.participantId));
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(
      [...TEXT_FIELDS.map(([k]) => k), 'chapterShowcasePresenter', 'registrationStatus'].map((k) => [k, f.get(k)]),
    );
    Object.assign(data, {
      accommodationRequired: accommodation,
      arrivalPlan: f.get('arrivalPlan'),
      maleAccommodationCount: Number(f.get('maleAccommodationCount') || 0),
      femaleAccommodationCount: Number(f.get('femaleAccommodationCount') || 0),
      accommodationParticipantNames: names,
    });
    try {
      await api(`registrations/${r.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      await onSaved();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(registrationStatus: string) {
    setSaving(true);
    setError('');
    try {
      await api(`registrations/${r.id}`, { method: 'PATCH', body: JSON.stringify({ registrationStatus }) });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside ref={panelRef} className="detail" aria-labelledby="detail-title">
      <div className="detail-head">
        <p className="eyebrow">{r.registrationCode} / Registration details</p>
        <button type="button" className="link-button" onClick={onClose}>
          Close ×
        </button>
      </div>
      <h2 id="detail-title">{r.collegeName}</h2>
      <p className="muted">
        {r.csiChapterName}
        {r.csiChapterId ? ` · ID ${r.csiChapterId}` : ''} · {r.city} ·{' '}
        <span className={`status status-${r.registrationStatus}`}>{r.registrationStatus}</span>
      </p>

      {canEdit && !editing && (
        <div className="detail-actions">
          {r.registrationStatus !== 'verified' && (
            <button type="button" className="button small" disabled={saving} onClick={() => setStatus('verified')}>
              Mark verified ✓
            </button>
          )}
          <button type="button" className="button outline small" onClick={() => setEditing(true)}>
            Edit registration
          </button>
        </div>
      )}

      <div className="detail-grid">
        <section>
          <h3>Faculty coordinator</h3>
          <p>
            <strong>{r.facultyCoordinatorName}</strong>
            <br />
            <a href={`mailto:${r.facultyCoordinatorEmail}`}>{r.facultyCoordinatorEmail}</a> ·{' '}
            <a href={`tel:${r.facultyCoordinatorContact}`}>{r.facultyCoordinatorContact}</a>
            <br />
            {r.facultyAccompanying ? 'Accompanying the delegation' : 'Not accompanying'}
          </p>
        </section>
        <section>
          <h3>Chapter Showcase presenter</h3>
          <p>
            <strong>{r.chapterShowcasePresenter}</strong>
          </p>
        </section>
        <section>
          <h3>Accommodation</h3>
          <p>
            {r.accommodationRequired
              ? `${ARRIVAL_LABELS[r.arrivalPlan ?? ''] ?? r.arrivalPlan} · ${r.maleAccommodationCount} male, ${r.femaleAccommodationCount} female · ${r.accommodationParticipantNames.join(', ')}`
              : 'Not requested'}
          </p>
        </section>
      </div>

      <section className="detail-people">
        <h3>Delegation ({detail.participants.length})</h3>
        <ul>
          {detail.participants.map((p) => (
            <li key={p.id}>
              <strong>
                {p.fullName}
                {team.has(p.id) && <em> · Expo team</em>}
              </strong>
              <span>
                {p.participantType === 'student' ? `${p.department} · Year ${p.year}` : 'Faculty coordinator'} · {p.email} ·{' '}
                {p.contactNumber}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {detail.expoProject && (
        <section className="detail-people">
          <h3>Project Expo</h3>
          <p>
            <strong>{detail.expoProject.projectTitle}</strong>
            <br />
            {detail.expoProject.category} · Review: {detail.expoProject.reviewStatus}
          </p>
          <p className="muted">{detail.expoProject.description}</p>
          <a className="text-link" href={`/api/admin/expo/${detail.expoProject.id}/abstract`}>
            Download abstract PDF <span aria-hidden="true">↓</span>
          </a>
        </section>
      )}

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {editing && (
        <form className="detail-form" onSubmit={save}>
          <div className="fields">
            {TEXT_FIELDS.map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={`edit-${key}`}>{label}</label>
                <input
                  id={`edit-${key}`}
                  name={key}
                  defaultValue={r[key] ?? ''}
                  required={key !== 'csiChapterId'}
                  type={key === 'facultyCoordinatorEmail' ? 'email' : 'text'}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="edit-presenter">Showcase presenter</label>
              <select id="edit-presenter" name="chapterShowcasePresenter" defaultValue={r.chapterShowcasePresenter}>
                {detail.participants
                  .filter((p) => p.participantType === 'student')
                  .map((p) => (
                    <option key={p.id}>{p.fullName}</option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-status">Registration status</label>
              <select id="edit-status" name="registrationStatus" defaultValue={r.registrationStatus}>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <label className="choice check is-block">
            <input type="checkbox" checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)} />
            <span>
              <strong>Accommodation requested</strong>
            </span>
          </label>
          {accommodation && (
            <>
              <div className="fields">
                <div className="field">
                  <label htmlFor="edit-arrival">Arrival</label>
                  <select id="edit-arrival" name="arrivalPlan" defaultValue={r.arrivalPlan ?? ''} required>
                    <option value="">Select arrival</option>
                    {Object.entries(ARRIVAL_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="edit-male">Male participants</label>
                  <input id="edit-male" name="maleAccommodationCount" type="number" min="0" defaultValue={r.maleAccommodationCount} />
                </div>
                <div className="field">
                  <label htmlFor="edit-female">Female participants</label>
                  <input id="edit-female" name="femaleAccommodationCount" type="number" min="0" defaultValue={r.femaleAccommodationCount} />
                </div>
              </div>
              <fieldset className="choice-group">
                <legend>Participants requiring accommodation</legend>
                <div className="choices">
                  {detail.participants.map((p) => (
                    <label key={p.id} className={`choice check${names.includes(p.fullName) ? ' is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={names.includes(p.fullName)}
                        onChange={(e) => setNames(e.target.checked ? [...names, p.fullName] : names.filter((n) => n !== p.fullName))}
                      />
                      <span>
                        <strong>{p.fullName}</strong>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <div className="step-actions">
            <button type="button" className="button outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="button" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
