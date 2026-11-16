'use client';

import { NextPage, PageIntro } from '@/components/site/PageParts';
import { PANEL } from '@/content/nexus';
import { useEffect, useRef, type CSSProperties } from 'react';

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

/** Sets --p on each card (0 → 1) as the following card slides over it. */
function useStackProgress() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = ref.current;
    if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const slides = Array.from(list.children) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      slides.forEach((slide, i) => {
        const card = slide.firstElementChild as HTMLElement | null;
        const next = slides[i + 1];
        if (!card) return;
        if (!next) return card.style.setProperty('--p', '0');
        const gap = next.getBoundingClientRect().top - slide.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, 1 - gap / slide.offsetHeight));
        card.style.setProperty('--p', p.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}

export default function PanelClient({ slot }: PanelClientProps) {
  const stackRef = useStackProgress();
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
            <ol className="panel-stack" ref={stackRef}>
              {PANEL.panelists.map((p, i) => (
                <li
                  key={p.name}
                  className="panel-slide"
                  style={{ '--i': i, '--n': PANEL.panelists.length } as CSSProperties}
                >
                  <article className="panel-slide-card">
                    {p.photo && (
                      <div className="panel-slide-poster">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photo} alt={`${p.name}, ${p.designation}, ${p.organisation}`} loading="lazy" />
                      </div>
                    )}
                    <div className="panel-slide-info">
                      <span className="panel-slide-count">
                        {String(i + 1).padStart(2, '0')}
                        <em> / {String(PANEL.panelists.length).padStart(2, '0')}</em>
                      </span>
                      <h3>{p.name}</h3>
                      <p className="panel-slide-role">
                        {p.designation}
                        <span>{p.organisation}</span>
                      </p>
                      {p.highlights && (
                        <ul>
                          {p.highlights.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
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
