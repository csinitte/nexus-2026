import type { Metadata } from 'next';
import Link from 'next/link';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, EXPO } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'Student Project Expo',
  description: `${EXPO.theme}. Submit your abstract by ${EVENT.abstractDeadlineDisplay} and exhibit at NMAMIT, Nitte on ${EVENT.eventDateDisplay}.`,
};

export default function ExpoPage() {
  return (
    <section className="section page expo-page">
      <PageIntro
        index={5}
        label="Innovating for impact"
        meta={`Abstracts due ${EVENT.abstractDeadlineDisplay}`}
        eyebrow="Innovating for impact"
        title="Student Project"
        accent="Expo."
      >
        <p className="theme">
          <span>Theme</span>
          {EXPO.theme}
        </p>
        <p className="lead">{EXPO.intro}</p>
        <p>{EXPO.eligibility}</p>
        <p className="muted">{EXPO.alignment}</p>
      </PageIntro>

      <dl className="detail-strip" data-reveal>
        <div>
          <dt>Abstract deadline</dt>
          <dd className="accent">{EVENT.abstractDeadlineDisplay}</dd>
        </div>
        <div>
          <dt>Team size</dt>
          <dd>{EXPO.teamSize}</dd>
        </div>
        <div>
          <dt>Exhibition</dt>
          <dd>
            {EVENT.eventDateDisplay} · {EVENT.venueShort}
          </dd>
        </div>
      </dl>

      <h2 className="list-title" data-reveal>
        Project categories
      </h2>
      <ol className="card-grid three">
        {EXPO.categories.map((c, i) => (
          <li key={c.title} data-reveal>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <strong>{c.title}</strong>
            <p>{c.text}</p>
          </li>
        ))}
      </ol>

      <h2 className="list-title" data-reveal>
        Expo process
      </h2>
      <div className="phases">
        <article className="phase" data-reveal>
          <p className="eyebrow">Phase 01</p>
          <h3>Abstract submission</h3>
          <p className="phase-date">
            Deadline <strong>{EVENT.abstractDeadlineDisplay}</strong>
          </p>
          <p>Submit your project abstract in PDF format through the NEXUS registration portal. It should cover:</p>
          <ul className="check-list">
            {EXPO.abstractRequirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="muted">
            Team size: {EXPO.teamSize}. All eligible registered teams proceed to the exhibition. Abstracts are reviewed for theme relevance,
            not shortlisting.
          </p>
        </article>
        <article className="phase" data-reveal>
          <p className="eyebrow">Phase 02</p>
          <h3>On-campus project exhibition</h3>
          <p className="phase-date">
            <strong>{EVENT.eventDateDisplay}</strong> · {EVENT.venueShort}
          </p>
          <p>All eligible teams present and demonstrate their projects before the jury.</p>
          <dl className="minutes">
            {EXPO.presentation.map((p) => (
              <div key={p.label}>
                <dt>{p.minutes} min</dt>
                <dd>{p.label}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <div className="guidelines" data-reveal>
        <h2 className="list-title">Exhibition guidelines</h2>
        <ul className="check-list">
          {EXPO.guidelines.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>

      <div className="callout" data-reveal>
        <div>
          <p className="eyebrow">Ready to exhibit?</p>
          <p>Register your delegation and upload your abstract by {EVENT.abstractDeadlineDisplay}.</p>
        </div>
        <Link className="button" href="/register">
          Register for Project Expo <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <NextPage current="/expo" />
    </section>
  );
}
