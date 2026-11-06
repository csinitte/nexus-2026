'use client';

import { useEffect, useRef } from 'react';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { EVENT, SHOWCASE } from '@/content/nexus';

function ShowcaseNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0, height = 0, dpr = 1, raf = 0;
    const nodes: { x: number; y: number; angle: number; speed: number; r: number }[] = [];
    const nodeCount = 18;
    function resize() {
      const rect = canvas.parentElement!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        nodes.push({ x: 0, y: 0, angle, speed: 0.0005 + Math.random() * 0.0015, r: 1.5 + Math.random() * 2 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2, centerY = height / 2;
      for (const n of nodes) {
        ctx.beginPath(); ctx.moveTo(centerX + n.x, centerY + n.y); ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = 'rgba(140, 234, 90, 0.08)'; ctx.lineWidth = 1; ctx.stroke();
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx.beginPath(); ctx.moveTo(centerX + a.x, centerY + a.y); ctx.lineTo(centerX + b.x, centerY + b.y);
            ctx.strokeStyle = `rgba(140, 234, 90, ${(1 - d / 160) * 0.15})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      ctx.beginPath(); ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#8cea5a'; ctx.fill();
      ctx.beginPath(); ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(140, 234, 90, 0.35)'; ctx.lineWidth = 2; ctx.stroke();
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(centerX + n.x, centerY + n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#8cea5a'; ctx.fill();
        ctx.beginPath(); ctx.arc(centerX + n.x, centerY + n.y, n.r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(140, 234, 90, 0.2)'; ctx.lineWidth = 1; ctx.stroke();
      }
      if (!reduced) {
        const now = Date.now() * 0.001;
        for (const n of nodes) {
          n.angle += n.speed;
          const pulse = 60 + Math.sin(now + n.angle) * 10;
          n.x = Math.cos(n.angle) * pulse;
          n.y = Math.sin(n.angle) * pulse;
        }
      }
      raf = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize(); draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="showcase-network" aria-hidden="true" />;
}

function ShowcaseStage({ index, item }: { index: number; item: { title: string; text: string } }) {
  return (
    <article className="showcase-stage" data-reveal>
      <span className="stage-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="stage-body"><strong>{item.title}</strong><span>{item.text}</span></div>
    </article>
  );
}

interface ShowcaseClientProps { slot: { start: string; end: string } | undefined; }

export default function ShowcaseClient({ slot }: ShowcaseClientProps) {
  return (
    <section className="section page showcase-page">
      <div className="showcase-hero">
        <ShowcaseNetwork />
        <div className="showcase-hero-content">
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
        </div>
      </div>

      <dl className="showcase-format" data-reveal>
        {SHOWCASE.details.map((d) => (
          <div key={d.label} className="format-item">
            <dt>{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>

      <div className="showcase-pathway" data-reveal>
        <h2 className="list-title">What each chapter will present</h2>
        <div className="pathway-grid">
          {SHOWCASE.areas.map((a, i) => (
            <ShowcaseStage key={a.title} index={i} item={a} />
          ))}
        </div>
        <div className="pathway-connections" aria-hidden="true" />
      </div>

      <div className="showcase-download" data-reveal>
        <div className="download-content">
          <p className="eyebrow">Standardised format</p>
          <p>Every registered chapter presents. Prepare your five minutes with the official template.</p>
        </div>
        <a className="button download-button" href={EVENT.showcaseTemplateUrl} download>
          Download presentation template <span aria-hidden="true">↓</span>
        </a>
      </div>
      <NextPage current="/showcase" />
    </section>
  );
}