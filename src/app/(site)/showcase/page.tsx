import type { Metadata } from 'next';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, SCHEDULE, SHOWCASE } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'CSI Chapter Showcase',
  description: `${SHOWCASE.tagline} Five-minute presentations from CSI student chapters across Karnataka at NEXUS 2026.`,
};

const slot = SCHEDULE.find((s) => s.href === '/showcase');

export default function ShowcasePage() {
  return (
    <section className="section page showcase-page">
      <PageIntro
        index={4}
        label="Chapters in focus"
        meta={slot ? `${slot.start} – ${slot.end}` : undefined}
        eyebrow={SHOWCASE.tagline}
        title="CSI Chapter"
        accent="Showcase."
      >
        {SHOWCASE.description.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </PageIntro>

      <dl className="detail-strip" data-reveal>
        {SHOWCASE.details.map((d) => (
          <div key={d.label}>
            <dt>{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="list-title" data-reveal>
        What each chapter will present
      </h2>
      <ol className="card-grid five">
        {SHOWCASE.areas.map((a, i) => (
          <li key={a.title} data-reveal>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <strong>{a.title}</strong>
            <p>{a.text}</p>
          </li>
        ))}
      </ol>

      <div className="callout" data-reveal>
        <div>
          <p className="eyebrow">Standardised format</p>
          <p>Every registered chapter presents. Prepare your five minutes with the official template.</p>
        </div>
        <a className="button" href={EVENT.showcaseTemplateUrl} download>
          Download presentation template <span aria-hidden="true">↓</span>
        </a>
      </div>
      <NextPage current="/showcase" />
    </section>
  );
}
