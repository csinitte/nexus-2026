import type { Metadata } from 'next';
import { PageIntro } from '@/components/site/PageParts';
import { LiveNow } from '@/components/phase2/LiveNow';
import { PreviewBanner } from '@/components/phase2/PreviewBanner';
import { LIVE_UPDATES } from '@/components/phase2/mock';
import { EVENT, SCHEDULE } from '@/content/nexus';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Live updates (preview)',
  robots: { index: false, follow: false },
};

export default function LivePage() {
  const updates = [...LIVE_UPDATES.filter((u) => u.pinned), ...LIVE_UPDATES.filter((u) => !u.pinned)];

  return (
    <section className="section page p2-live">
      <PreviewBanner note="Sample updates — the clock starts at 11:42 AM on event day" />
      <PageIntro index={8} label="Event day" meta={EVENT.eventDateDisplay} eyebrow="Live" title="Live at" accent="NEXUS.">
        <p>Where the day is right now, what’s next, and every announcement from the organising team.</p>
      </PageIntro>

      <LiveNow sessions={SCHEDULE} startAt="11:42 AM" />

      <div className="schedule-timeline-intro p2-updates-intro" data-reveal>
        <div>
          <p className="eyebrow">From the organising team</p>
          <h2>
            Latest <em>updates.</em>
          </h2>
        </div>
        <p>
          <strong>{String(updates.length).padStart(2, '0')}</strong> posts <span aria-hidden="true">/</span> Newest first
        </p>
      </div>
      <ol className="p2-updates">
        {updates.map((u) => (
          <li key={u.id} className={u.pinned ? 'is-pinned' : undefined} data-reveal>
            <time>{u.time}</time>
            <div>
              <p className="p2-label">
                {u.pinned ? 'Pinned' : u.tag}
                {u.pinned && <span> · {u.tag}</span>}
              </p>
              <p>{u.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
