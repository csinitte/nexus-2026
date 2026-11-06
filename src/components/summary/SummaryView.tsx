'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EVENT } from '@/content/nexus';

type Detail = {
  registration: {
    registrationCode: string;
    collegeName: string;
    csiChapterName: string;
    city: string;
    facultyCoordinatorName: string;
    facultyAccompanying: boolean;
    totalRepresentatives: number;
    chapterShowcasePresenter: string;
    accommodationRequired: boolean;
    accommodationParticipantNames: string[];
    registrationStatus: string;
  };
  participants: { id: string; fullName: string; department: string; year: number; participantType: string }[];
  expoProject: { teamName: string | null; projectTitle: string; category: string; reviewStatus: string } | null;
};

/** Reads `#CODE:TOKEN` from the confirmation link and loads the signed summary. */
export function SummaryView() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const [code, token] = window.location.hash.slice(1).split(':').map(decodeURIComponent);
    if (!code || !token) {
      queueMicrotask(() => setError('This summary link is incomplete. Open the full link from your confirmation email.'));
      return;
    }
    fetch(`/api/registrations/${encodeURIComponent(code)}/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('This link is invalid or has expired. Contact the organising team for help.');
        setDetail(await response.json());
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="success">
        <p className="eyebrow">Registration summary</p>
        <h1>
          Link <em>unavailable.</em>
        </h1>
        <p className="form-alert" role="alert">
          {error}
        </p>
        <Link className="button outline" href="/contact">
          Contact the organisers
        </Link>
      </div>
    );

  if (!detail)
    return (
      <div className="success" role="status">
        <p className="muted">Loading your summary…</p>
      </div>
    );

  const r = detail.registration;
  const students = detail.participants.filter((p) => p.participantType === 'student');
  return (
    <div className="success">
      <p className="eyebrow">
        <span className="dot" aria-hidden="true" /> Registration summary
      </p>
      <h1>
        Your place <em>at NEXUS.</em>
      </h1>
      <div className="code-block">
        <span>Registration ID</span>
        <strong>{r.registrationCode}</strong>
      </div>
      <section className="summary-card" aria-label="Registration details">
        <dl>
          <div>
            <dt>College</dt>
            <dd>
              {r.collegeName}, {r.city}
            </dd>
          </div>
          <div>
            <dt>CSI chapter</dt>
            <dd>{r.csiChapterName}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd className="cap">{r.registrationStatus}</dd>
          </div>
          <div>
            <dt>Faculty coordinator</dt>
            <dd>
              {r.facultyCoordinatorName} {r.facultyAccompanying ? '(accompanying)' : '(not accompanying)'}
            </dd>
          </div>
          <div>
            <dt>Delegation</dt>
            <dd>{r.totalRepresentatives} representatives</dd>
          </div>
          <div>
            <dt>Students</dt>
            <dd>
              <ul>
                {students.map((p) => (
                  <li key={p.id}>
                    {p.fullName} — {p.department}, Year {p.year}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Showcase presenter</dt>
            <dd>{r.chapterShowcasePresenter}</dd>
          </div>
          <div>
            <dt>Project Expo</dt>
            <dd>{detail.expoProject ? `${detail.expoProject.teamName ? `${detail.expoProject.teamName} · ` : ''}${detail.expoProject.projectTitle} · ${detail.expoProject.category}` : 'Not participating'}</dd>
          </div>
          <div>
            <dt>Accommodation</dt>
            <dd>{r.accommodationRequired ? `Requested for ${r.accommodationParticipantNames.join(', ')}` : 'Not requested'}</dd>
          </div>
        </dl>
      </section>
      <ul className="notice-list">
        {r.accommodationRequired && <li>Accommodation is subject to availability. A request does not guarantee accommodation.</li>}
        {detail.expoProject && <li>Abstracts are reviewed for theme relevance; this is not jury approval of the project.</li>}
        <li>
          See you on {EVENT.eventDateDisplay} at {EVENT.venueShort}.
        </li>
      </ul>
      <div className="success-actions no-print">
        <button type="button" className="button" onClick={() => window.print()}>
          Print / save as PDF <span aria-hidden="true">↓</span>
        </button>
        <Link className="button outline" href="/">
          Return to NEXUS
        </Link>
      </div>
    </div>
  );
}
