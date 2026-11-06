'use client';

import Link from 'next/link';
import { EVENT } from '@/content/nexus';

export type RegistrationResult = {
  registrationCode: string;
  whatsappLink: string | null;
  confirmationToken: string | null;
  emailDelivery?: { status: 'sent' | 'skipped' | 'failed' | string };
  summary: {
    collegeName: string;
    csiChapterName: string;
    city: string;
    facultyCoordinatorName: string;
    facultyCoordinatorEmail: string;
    facultyAccompanying: boolean;
    totalRepresentatives: number;
    chapterShowcasePresenter: string;
    accommodationRequired: boolean;
    accommodationParticipantNames: string[];
    arrivalPlan: string | null;
  };
  participants: { fullName: string; department: string; year: number }[];
  expo: { teamName: string; projectTitle: string; category: string } | null;
};

const ARRIVAL: Record<string, string> = {
  '2026-11-24_NIGHT': '24 November 2026, previous night',
  '2026-11-25_MORNING': '25 November 2026, event morning',
};

export function RegistrationSuccess({ result, coordinatorEmail }: { result: RegistrationResult; coordinatorEmail: string }) {
  const s = result.summary;
  const summaryHref = result.confirmationToken
    ? `/summary#${encodeURIComponent(result.registrationCode)}:${encodeURIComponent(result.confirmationToken)}`
    : null;
  const emailed = result.emailDelivery?.status === 'sent';

  return (
    <div className="success" aria-live="polite">
      <p className="eyebrow">
        <span className="dot" aria-hidden="true" /> Registration submitted
      </p>
      <h1 tabIndex={-1} ref={(el) => el?.focus()}>
        You’re in. <em>See you at NEXUS.</em>
      </h1>
      <p className="lead">Your registration for NEXUS 2026 has been successfully submitted!</p>

      <div className="code-block">
        <span>Your registration ID</span>
        <strong>{result.registrationCode}</strong>
      </div>

      <p>
        We look forward to welcoming your delegation to NMAMIT, Nitte, on {EVENT.eventDateDisplay}.{' '}
        {emailed
          ? `A confirmation has been sent to ${s.facultyCoordinatorEmail || coordinatorEmail}.`
          : 'Please save or print this summary — keep your registration ID for any queries.'}
      </p>

      <div className="success-actions no-print">
        {result.whatsappLink && (
          <a className="button" href={result.whatsappLink} target="_blank" rel="noopener noreferrer">
            Join the NEXUS 2026 WhatsApp group <span aria-hidden="true">↗</span>
          </a>
        )}
        <button type="button" className="button outline" onClick={() => window.print()}>
          Download summary (PDF) <span aria-hidden="true">↓</span>
        </button>
        {summaryHref && (
          <a className="button outline" href={summaryHref}>
            Open summary link <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <section className="summary-card" aria-labelledby="summary-title">
        <h2 id="summary-title">Registration summary</h2>
        <dl>
          <div>
            <dt>Registration ID</dt>
            <dd>{result.registrationCode}</dd>
          </div>
          <div>
            <dt>College</dt>
            <dd>
              {s.collegeName}, {s.city}
            </dd>
          </div>
          <div>
            <dt>CSI chapter</dt>
            <dd>{s.csiChapterName}</dd>
          </div>
          <div>
            <dt>Faculty coordinator</dt>
            <dd>
              {s.facultyCoordinatorName}
              {s.facultyAccompanying ? ' (accompanying)' : ' (not accompanying)'}
            </dd>
          </div>
          <div>
            <dt>Delegation</dt>
            <dd>{s.totalRepresentatives} representatives</dd>
          </div>
          <div>
            <dt>Students</dt>
            <dd>
              <ul>
                {result.participants.map((p) => (
                  <li key={p.fullName}>
                    {p.fullName} — {p.department}, Year {p.year}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Chapter Showcase presenter</dt>
            <dd>{s.chapterShowcasePresenter}</dd>
          </div>
          <div>
            <dt>Project Expo</dt>
            <dd>{result.expo ? `${result.expo.teamName} · ${result.expo.projectTitle} · ${result.expo.category}` : 'Not participating'}</dd>
          </div>
          <div>
            <dt>Accommodation</dt>
            <dd>
              {s.accommodationRequired
                ? `Requested for ${s.accommodationParticipantNames.join(', ')} · ${ARRIVAL[s.arrivalPlan ?? ''] ?? ''}`
                : 'Not requested'}
            </dd>
          </div>
        </dl>
      </section>

      <ul className="notice-list">
        {s.accommodationRequired && (
          <li>Accommodation is subject to availability. Submitting a request does not guarantee accommodation.</li>
        )}
        {result.expo && (
          <li>
            Your Expo abstract has been received. Abstracts are reviewed for theme relevance; this is not jury approval of the project.
          </li>
        )}
        <li>
          Questions? <Link href="/contact">Contact the organising team</Link>.
        </li>
      </ul>

      <Link className="text-link no-print" href="/">
        Return to NEXUS <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
