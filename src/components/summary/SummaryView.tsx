'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EVENT } from '@/content/nexus';
import { rememberRegistration, useRegistrationReceipt } from '@/components/register/registration-receipt';

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
    paymentStatus: string;
  };
  participants: { id: string; fullName: string; department: string; year: number; participantType: string }[];
  expoProject: { teamName: string | null; projectTitle: string; category: string; reviewStatus: string } | null;
};

/** Reads `#CODE:TOKEN` from the confirmation link and loads the signed summary. */
export function SummaryView() {
  const receipt = useRegistrationReceipt();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [needsLink, setNeedsLink] = useState(false);

  useEffect(() => {
    let activeRequest: AbortController | undefined;

    async function loadSummary() {
      activeRequest?.abort();
      const controller = new AbortController();
      activeRequest = controller;
      setDetail(null);
      setError('');
      setNeedsLink(false);
      try {
        const [code, token] = window.location.hash.slice(1).split(':').map(decodeURIComponent);
        if (!code || !token) {
          setNeedsLink(true);
          return;
        }
        const response = await fetch(`/api/registrations/${encodeURIComponent(code)}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('This link is invalid or has expired. Contact the organising team for help.');
        const summary: Detail = await response.json();
        if (controller.signal.aborted) return;
        if (summary.registration.registrationStatus !== 'cancelled') {
          rememberRegistration(summary.registration.registrationCode);
        }
        setDetail(summary);
      } catch {
        if (!controller.signal.aborted) setError('We couldn’t open this summary. Check the link from your confirmation email or contact the organisers.');
      }
    }

    let mounted = true;
    queueMicrotask(() => {
      if (mounted) void loadSummary();
    });
    window.addEventListener('hashchange', loadSummary);
    return () => {
      mounted = false;
      activeRequest?.abort();
      window.removeEventListener('hashchange', loadSummary);
    };
  }, []);

  if (needsLink)
    return (
      <div className="success">
        <p className="eyebrow">Registration summary</p>
        <h1>{receipt ? 'Your registration' : 'Already registered?'}</h1>
        {receipt && (
          <div className="code-block">
            <span>Registration ID saved on this device</span>
            <strong>{receipt}</strong>
          </div>
        )}
        <p>Open the secure link in your confirmation email to see your registration and payment status. If you don’t have the link, contact the organisers to confirm your registration before paying again.</p>
        <div className="success-actions">
          <Link className="button outline" href="/contact">Contact the organisers</Link>
          <Link className="text-link" href="/register">{receipt ? 'Register another team' : 'Start a new registration'}</Link>
        </div>
      </div>
    );

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
            <dt>CSI branch</dt>
            <dd>{r.csiChapterName}</dd>
          </div>
          <div>
            <dt>Registration status</dt>
            <dd className="cap">{r.registrationStatus}</dd>
          </div>
          <div>
            <dt>Payment status</dt>
            <dd>{r.paymentStatus}</dd>
          </div>
          <div>
            <dt>Faculty coordinator</dt>
            <dd>
              {r.facultyCoordinatorName} {r.facultyAccompanying ? '(accompanying)' : '(not accompanying)'}
            </dd>
          </div>
          <div>
            <dt>Students in this registration</dt>
            <dd>{r.totalRepresentatives}</dd>
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
            <dt>Students requiring accommodation</dt>
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

