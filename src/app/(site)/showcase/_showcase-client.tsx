'use client';

import { useEffect, useRef, useState } from 'react';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, SHOWCASE } from '@/content/nexus';

/* --------------------------------------------------------------------------
   Hero network illustration — collaboration between student chapters.
   Rendered as a dedicated visual area on the right of the hero, separated
   from the heading and description so it never competes with the text.
   -------------------------------------------------------------------------- */
function ShowcaseHeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<{ x: number; y: number; r: number }[]>([]);
  const [links, setLinks] = useState<{ x: number; y: number; w: number; a: number; o: number }[]>([]);

  useEffect(() => {
    const root = ref.current!;
    function compute() {
      const rect = root.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.44;
      const count = 7;
      const arr: { x: number; y: number; r: number }[] = [];
      const lnk: { x: number; y: number; w: number; a: number; o: number }[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        arr.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, r: 5 + (i % 3) * 3 });
      }
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        const a = arr[i], b = arr[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        lnk.push({ x: a.x, y: a.y, w: Math.hypot(dx, dy), a: (Math.atan2(dy, dx) * 180) / Math.PI, o: 0.22 });
      }
      setNodes(arr);
      setLinks(lnk);
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <div className="showcase-hero-visual" ref={ref} aria-hidden="true">
      <div className="hero-network">
        <div className="network-ring" />
        <div className="network-ring" style={{ animationDuration: '16s', animationDirection: 'reverse', borderStyle: 'dashed' }} />
        {links.map((l, i) => (
          <div key={`link-${i}`} className="network-line" style={{ left: l.x, top: l.y, width: l.w, height: 1, transform: `rotate(${l.a}deg)`, opacity: l.o }} />
        ))}
        {nodes.map((n, i) => (
          <div key={`node-${i}`} className="network-node" style={{ left: n.x - n.r, top: n.y - n.r, width: n.r * 2, height: n.r * 2 }} />
        ))}
      </div>
    </div>
  );
}

/* Minimal icon drawn with CSS — no extra image assets required. */
function CardIcon({ kind }: { kind: 'overview' | 'activities' | 'achievements' }) {
  return (
    <div className={`card-icon card-icon--${kind}`} aria-hidden="true">
      <div className="icon-ring" />
      {kind === 'overview' && <div className="icon-node" />}
      {kind === 'activities' && <div className="icon-spark" />}
      {kind === 'achievements' && <div className="icon-star" />}
    </div>
  );
}

function ShowcaseCard({ index, item }: { index: number; item: { title: string; text: string } }) {
  const kind = (['overview', 'activities', 'achievements'] as const)[index] ?? 'overview';
  return (
    <article className="showcase-card" data-reveal>
      <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
      <CardIcon kind={kind} />
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-text">{item.text}</p>
      </div>
    </article>
  );
}

/* Event-format info block: label + prominent value + minimal icon. */
function FormatStat({ label, value }: { label: string; value: string }) {
  const icons: Record<string, React.ReactNode> = {
    Duration: <span className="format-icon format-icon--clock" aria-hidden="true" />,
    Format: <span className="format-icon format-icon--doc" aria-hidden="true" />,
    'Q&A': <span className="format-icon format-icon--chat" aria-hidden="true" />,
  };
  return (
    <div className="format-block" data-reveal>
      <div className="format-symbol">{icons[label]}</div>
      <div className="format-label">{label}</div>
      <div className="format-value">{value}</div>
    </div>
  );
}

/* CSS preview of the standardised presentation template (no extra asset). */
function TemplatePreview() {
  return (
    <div className="template-preview" aria-hidden="true">
      <div className="template-device">
        <div className="template-screen">
          <div className="template-bar" />
          <div className="template-slide">
            <div className="template-title-line" />
            <div className="template-divider" />
            <div className="template-body">
              <div className="template-line template-line--long" />
              <div className="template-line template-line--short" />
              <div className="template-line template-line--short" />
              <div className="template-line template-line--micro" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShowcaseClientProps { slot: { start: string; end: string } | undefined; }

export default function ShowcaseClient({ slot }: ShowcaseClientProps) {
  const timeText = slot ? `${slot.start} – ${slot.end}` : undefined;
  return (
    <section className="section page showcase-page">
      <div className="showcase-hero">
        <div className="showcase-hero-content">
          <PageIntro
            index={4}
            label="CHAPTERS IN FOCUS"
            meta={timeText}
            eyebrow={SHOWCASE.tagline}
            title="CSI Chapter"
            accent="Showcase"
          />
          <div className="showcase-intro">
            {SHOWCASE.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <ShowcaseHeroVisual />
      </div>

      <div className="showcase-requirements" data-reveal>
        <h2 className="list-title">What each chapter will present</h2>
        <div className="requirement-grid">
          {SHOWCASE.areas.map((a, i) => (
            <ShowcaseCard key={a.title} index={i} item={a} />
          ))}
        </div>
      </div>

      <div className="showcase-event-format" data-reveal>
        <h2 className="list-title">Event format</h2>
        <div className="format-strip">
          {SHOWCASE.details.map((d) => (
            <FormatStat key={d.label} label={d.label} value={d.value} />
          ))}
        </div>
      </div>

      <div className="showcase-download" data-reveal>
        <div className="download-layout">
          <div className="download-info">
            <p className="eyebrow">Standardised format</p>
            <h3 className="download-heading">Standardised presentation template</h3>
            <p className="download-desc">Every registered chapter presents. Prepare your five minutes with the official template.</p>
          </div>
          <div className="download-preview">
            <TemplatePreview />
          </div>
          <a className="button download-button" href={EVENT.showcaseTemplateUrl} download>
            <span aria-hidden="true">↓</span> Download presentation template
          </a>
        </div>
      </div>

      <NextPage current="/showcase" />
    </section>
  );
}
