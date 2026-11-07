import type { Metadata } from 'next';
import Link from 'next/link';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, EXPO } from '@/content/nexus';
import { PrizePool } from '@/components/prize/PrizePool';
import { TrackGallery } from '@/components/expo/TrackGallery';

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
        <p>Bring an existing project, prototype, software or hardware idea. All projects should fit the event theme.</p>
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

      <TrackGallery tracks={EXPO.categories} />

      <section className="expo-journey" data-reveal aria-labelledby="expo-journey-title">
        <div className="expo-journey-heading"><p className="eyebrow">From idea to exhibition</p><h2 id="expo-journey-title">Two steps to <em>the expo.</em></h2></div>
        <div className="expo-journey-steps">
          <article className="expo-step">
            <span className="expo-step-number">01</span><div><span className="expo-step-label">BY {EVENT.abstractDeadlineDisplay.toUpperCase()}</span><h3>Submit your abstract</h3><p>Register your team and upload a PDF about your project.</p><span className="expo-step-note">{EXPO.teamSize} per team · Reviewed for theme relevance</span></div>
          </article>
          <article className="expo-step">
            <span className="expo-step-number">02</span><div><span className="expo-step-label">{EVENT.eventDateDisplay.toUpperCase()} · {EVENT.venueShort.toUpperCase()}</span><h3>Show it at NEXUS</h3><p>Present your project and demonstrate it to the jury at NMAMIT.</p><span className="expo-step-note">7 min presentation & demo · 3 min jury Q&amp;A</span></div>
          </article>
        </div>
        <p className="expo-journey-footnote">All eligible registered teams proceed to the exhibition; abstracts are not used for shortlisting.</p>
      </section>

      <details className="expo-details">
        <summary>What to include & bring <span aria-hidden="true">+</span></summary>
        <div className="expo-details-content"><div><h3>Your abstract</h3><ul>{EXPO.abstractRequirements.map(item => <li key={item}>{item}</li>)}</ul></div><div><h3>At the exhibition</h3><ul>{EXPO.guidelines.map(item => <li key={item}>{item}</li>)}</ul></div></div>
      </details>

      {/* Prize Pool â€” shared <PrizePool /> component */}
      <PrizePool />

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
