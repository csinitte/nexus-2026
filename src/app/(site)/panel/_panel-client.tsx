'use client';

import { NextPage, PageIntro } from '@/components/site/PageParts';
import { PANEL } from '@/content/nexus';

function HighlightPanel({ index, item }: { index: number; item: { title: string; text: string } }) {
  return (
    <article className="highlight-panel">
      <span className="highlight-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="highlight-body">
        <strong>{item.title}</strong>
        <span>{item.text}</span>
      </div>
    </article>
  );
}

interface PanelClientProps {
  slot: { start: string; end: string } | undefined;
}

export default function PanelClient({ slot }: PanelClientProps) {
  const timeText = slot ? `${slot.start} – ${slot.end}` : undefined;

  return (
    <section className="section page panel-page">
      <div className="panel-container">
        {/* 1. 03 / THE CONVERSATION, 2. VOICES OF THE FUTURE, 3. Industry Panel discussion heading */}
        <PageIntro
          index={3}
          label="The conversation"
          eyebrow="Voices of the future"
          title="Industry panel"
          accent="discussion."
        />

        {/* 4. Event number and timing */}
        <div className="session-strip">
          <span className="session-id">03</span>
          {timeText && <span className="session-time">{timeText}</span>}
        </div>

        {/* 5. Topic card — wide, balanced layout */}
        <div className="topic-panel">
          <p className="topic-eyebrow">Topic</p>
          <h2 className="topic-title">
            From <span className="accent-word">Skills</span> to <span className="accent-word">Startups</span>: Preparing the Next Generation of <span className="accent-word">Tech Innovators</span>
          </h2>
        </div>

        {/* 6. Description and supporting text */}
        <div className="panel-description">
          {PANEL.description.map((p, i) => (
            <p key={p} className={i === 0 ? 'lead' : undefined}>
              {p}
            </p>
          ))}
        </div>

        {/* 7. Discussion highlights section */}
        <div className="panel-discussion">
          <h2 className="list-title">Discussion highlights</h2>
          <div className="highlight-grid">
            {PANEL.highlights.map((h, i) => (
              <HighlightPanel key={h.title} index={i} item={h} />
            ))}
          </div>
        </div>

        {/* ── Panelists ────────────────────────────────────────────── */}
        <div className="panelists-section">
          <h2 className="list-title">Panelists</h2>
          {PANEL.panelists.length ? (
            <ul className="panelist-grid">
              {PANEL.panelists.map((p) => (
                <li key={p.name}>
                  <article className="panelist-card">
                    <div className="panelist-info">
                      <strong>{p.name}</strong>
                      <span>{p.designation}</span>
                      <span>{p.organisation}</span>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="panelists-empty">
              <p>Panelists and the moderator will be announced soon.</p>
            </div>
          )}
        </div>

        <NextPage current="/panel" />
      </div>
    </section>
  );
}
