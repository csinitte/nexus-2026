'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { PANEL } from '@/content/nexus';

function PanelNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0, height = 0, dpr = 1, raf = 0;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const nodeCount = 12, connectionDist = 180;
    function resize() {
      const rect = canvas.parentElement!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({ x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: 1.5 + Math.random() * 2.5 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < connectionDist) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(140, 234, 90, ${(1 - d / connectionDist) * 0.25})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#8cea5a'; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(140, 234, 90, 0.15)'; ctx.lineWidth = 1; ctx.stroke();
      }
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }
      }
      raf = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize(); draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="panel-network" aria-hidden="true" />;
}

function HighlightPanel({ index, item }: { index: number; item: { title: string; text: string } }) {
  return (
    <article className="highlight-panel" data-reveal>
      <span className="highlight-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="highlight-body"><strong>{item.title}</strong><span>{item.text}</span></div>
    </article>
  );
}

function PanelistCard({ p }: { p: { name: string; designation: string; organisation: string; photo?: string; moderator?: boolean } }) {
  return (
    <article className="panelist-card" data-reveal>
      <div className="panelist-photo">
        {p.photo ? <Image src={p.photo} alt={p.name} width={320} height={400} className="panelist-img" /> : <div className="panelist-placeholder" aria-hidden="true" />}
        {p.moderator && <span className="panelist-mod">Moderator</span>}
      </div>
      <div className="panelist-info"><strong>{p.name}</strong><span>{p.designation}</span><span>{p.organisation}</span></div>
    </article>
  );
}

interface PanelClientProps { slot: { start: string; end: string } | undefined; }

export default function PanelClient({ slot }: PanelClientProps) {
  return (
    <section className="section page panel-page">
      <div className="panel-hero">
        <PanelNetwork />
        <div className="panel-hero-content">
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
          <div className="panel-description" data-reveal>
            {PANEL.description.map((p, i) => (
              <p key={p} className={i === 0 ? 'lead' : undefined}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-discussion" data-reveal>
        <h2 className="list-title">Discussion highlights</h2>
        <div className="highlight-grid">
          {PANEL.highlights.map((h, i) => (
            <HighlightPanel key={h.title} index={i} item={h} />
          ))}
        </div>
        <div className="highlight-connections" aria-hidden="true" />
      </div>

      <div className="panelists-section" data-reveal>
        <h2 className="list-title">Panelists</h2>
        {PANEL.panelists.length ? (
          <ul className="panelist-grid">
            {PANEL.panelists.map((p) => (
              <li key={p.name}>
                <PanelistCard p={p} />
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
    </section>
  );
}