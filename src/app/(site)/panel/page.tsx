import type { Metadata } from 'next';
import Image from 'next/image';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { PANEL, SCHEDULE } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'Industry Panel Discussion',
  description: `${PANEL.topic} — an industry panel discussion at NEXUS 2026.`,
};

const slot = SCHEDULE.find((s) => s.href === '/panel');

export default function PanelPage() {
  return (
    <section className="section page panel-page">
      <div className="page-art" aria-hidden="true">
        <Image src="/bg_1.png" alt="" fill sizes="100vw" loading="eager" />
      </div>
      <PageIntro
        index={3}
        label="The conversation"
        meta={slot ? `${slot.start} – ${slot.end}` : undefined}
        eyebrow="Voices of the future"
        title="Industry panel"
        accent="discussion."
      />

      <div className="panel-topic" data-reveal>
        <p className="eyebrow">Topic</p>
        <p className="topic">{PANEL.topic}</p>
      </div>

      <div className="split">
        <div className="prose" data-reveal>
          {PANEL.description.map((p, i) => (
            <p key={p} className={i === 0 ? 'lead' : undefined}>
              {p}
            </p>
          ))}
        </div>
        <div data-reveal>
          <h2 className="list-title">Discussion highlights</h2>
          <ol className="numbered-list">
            {PANEL.highlights.map((h) => (
              <li key={h.title}>
                <strong>{h.title}</strong>
                <span>{h.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="panelists" data-reveal>
        <h2 className="list-title">Panelists</h2>
        {PANEL.panelists.length ? (
          <ul className="panelist-grid">
            {PANEL.panelists.map((p) => (
              <li key={p.name}>
                {p.photo && <Image src={p.photo} alt="" width={320} height={400} />}
                <strong>{p.name}</strong>
                <span>
                  {p.designation}, {p.organisation}
                  {p.moderator ? ' · Moderator' : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Panelists and the moderator will be announced soon.</p>
        )}
      </div>
      <NextPage current="/panel" />
    </section>
  );
}
