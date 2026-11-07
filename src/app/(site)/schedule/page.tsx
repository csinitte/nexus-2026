import type { Metadata } from 'next';
import Link from 'next/link';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, SCHEDULE } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'Event Schedule',
  description: `The full programme for ${EVENT.name} on ${EVENT.eventDateDisplay} at NMAMIT, Nitte — from registration to the valedictory ceremony.`,
};

export default function SchedulePage() {
  return (
    <section className="section page schedule-page">
      <PageIntro
        index={2}
        label="The programme"
        meta={EVENT.eventDateDisplay}
        eyebrow="A day worth sharing"
        title="The day at"
        accent="NEXUS."
      >
        <p>A clear overview of the summit, from the morning welcome to the closing ceremony. All times are IST.</p>
      </PageIntro>

      <div className="schedule-timeline-intro">
        <div><p className="eyebrow">The programme · {EVENT.dateCompact}</p><h2>One day. <em>Many possibilities.</em></h2></div>
        <p><strong>{String(SCHEDULE.length).padStart(2, '0')}</strong> sessions <span aria-hidden="true">/</span> All times IST</p>
      </div>
      <ol className="timeline" aria-label={`Schedule for ${EVENT.eventDateDisplay}`}>
        {SCHEDULE.map((item, i) => (
          <li key={item.iso} className={item.href ? 'is-feature' : undefined} data-reveal>
            <span className="timeline-node" aria-hidden="true" />
            <time dateTime={`${EVENT.eventDateIso}T${item.iso}`}>
              {item.start}
              <span> – {item.end}</span>
            </time>
            <div className="timeline-body">
              <span className="timeline-index">{String(i + 1).padStart(2, '0')}</span>
              <h2>{item.title}</h2>
              {item.href && (
                <Link href={item.href} className="text-link">
                  Details <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <NextPage current="/schedule" />
    </section>
  );
}
