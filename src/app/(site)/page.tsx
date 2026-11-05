import Image from 'next/image';
import Link from 'next/link';
import { NextPage, SectionLabel } from '@/components/site/PageParts';
import { Parallax } from '@/components/site/Parallax';
import { ABOUT, EVENT, HOSTS, NAV_ITEMS } from '@/content/nexus';
import { IntroGate } from '@/components/intro/IntroGate';
import { LogoStory } from '@/components/story/LogoStory';
import { OBJECTS } from '@/components/story/shapes';

const EXPLORE = [
  { href: '/schedule', label: 'The day at NEXUS', text: 'Eight moments, from inauguration to valedictory.' },
  { href: '/panel', label: 'Industry Panel', text: 'From skills to startups with industry voices.' },
  { href: '/showcase', label: 'Chapter Showcase', text: 'Five minutes to share your chapter’s journey.' },
  { href: '/expo', label: 'Project Expo', text: 'Technology for a sustainable, smarter future.' },
];

export default function HomePage() {
  return (
    <>
      <IntroGate />
      <section className="nx-hero" aria-labelledby="hero-title">
        <div className="nx-stage">
          <div className="nx-logo">
            <div className="nx-halo" aria-hidden="true" />
            <Orbit layer="back" />
            <h1 id="hero-title">
              <Image
                src="/brand/nexus-wordmark.png"
                alt={`NEXUS 2026 — ${EVENT.subtitle}`}
                width={1708}
                height={290}
                priority
                sizes="70vw"
              />
            </h1>
            <Orbit layer="front" />
          </div>
          <Parallax className="nx-robot" strength={-0.06}>
            <Image src="/brand/robot.png" alt="" width={772} height={841} priority sizes="(max-width: 700px) 78vw, 36vw" />
            <Image className="nx-pulse" src="/brand/robot-glow.png" alt="" width={772} height={841} sizes="(max-width: 700px) 78vw, 36vw" />
          </Parallax>
        </div>

        <div className="hero-band">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" aria-hidden="true" /> {EVENT.dateCompact} · {EVENT.venueShort}
            </p>
            <p className="hero-subtitle">CSI Student Summit on Innovation &amp; Technology</p>
            <p className="hero-tagline">
              Connecting chapters. <em>Inspiring innovation.</em>
            </p>
            <div className="hero-ctas">
              <Link className="button" href="/register">
                Register now <span aria-hidden="true">↗</span>
              </Link>
              <a className="button outline" href="#about">
                Explore NEXUS <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <dl className="hero-bottom">
            <div>
              <dt>The date</dt>
              <dd>
                <time dateTime={EVENT.eventDateIso}>{EVENT.dateCompact}</time>
              </dd>
            </div>
            <div>
              <dt>The venue</dt>
              <dd>{EVENT.hostInstitution}</dd>
            </div>
            <div>
              <dt>Hosted by</dt>
              <dd>{EVENT.organiser}</dd>
            </div>
            <div className="hero-logos">
              <Image src="/nitte_white.png" alt="Nitte (Deemed to be University) — NMAMIT" width={1628} height={278} sizes="160px" />
              <Image src="/csi.jpeg" alt="Computer Society of India" width={1140} height={1141} sizes="48px" />
            </div>
          </dl>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {Array.from({ length: 2 }, (_, n) => (
            <span key={n}>
              Connect <i>✳</i> Collaborate <i>✳</i> Create impact <i>✳</i> Connecting chapters <i>✳</i> Inspiring innovation <i>✳</i>{' '}
            </span>
          ))}
        </div>
      </div>

      <section className="story" aria-label="About NEXUS and its hosts">
        <div className="story-stage" data-story-stage aria-hidden="true">
          <ol className="story-captions">
            {OBJECTS.map((o, i) => (
              <li key={o.id} data-index={i}>
                <span>/{String(i + 1).padStart(2, '0')}</span> {o.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="story-chapters">
          <article id="about" className="story-chapter" data-chapter="0" aria-labelledby="about-title">
            <SectionLabel index={1} left="The summit" right="About NEXUS" />
            <h2 id="about-title" data-reveal>
              About <em>NEXUS.</em>
            </h2>
            <div className="prose" data-reveal>
              <p className="lead">{ABOUT.paragraphs[0]}</p>
              {ABOUT.paragraphs.slice(1).map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="signature">Connecting Chapters. Inspiring Innovation.</p>
            </div>
            <ul className="stats" aria-label="Participation highlights">
              {ABOUT.stats.map((s) => (
                <li key={s.label} data-reveal>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                  <small>{s.note}</small>
                </li>
              ))}
            </ul>
            <p className="footnote">{ABOUT.statsNote}</p>
          </article>

          <article id="hosts" className="story-chapter" data-chapter="1" aria-labelledby="hosts-title">
            <SectionLabel index={2} left="The hosts" right="CSI Student Branch, NMAMIT" />
            <h2 id="hosts-title" data-reveal>
              About the <em>hosts.</em>
            </h2>
            <div className="host-grid">
              {HOSTS.map((host) => (
                <article key={host.id} className="host-card" aria-labelledby={`host-${host.id}`} data-reveal>
                  <div className={`host-logo host-logo-${host.id}`}>
                    <Image src={host.logo.src} alt={host.logo.alt} width={host.logo.width} height={host.logo.height} sizes="240px" />
                  </div>
                  <p className="eyebrow">{host.eyebrow}</p>
                  <h3 id={`host-${host.id}`}>About {host.name}</h3>
                  {host.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  <dl className="host-facts">
                    {host.facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </article>

          <article className="story-chapter" data-chapter="2" aria-labelledby="explore-title">
            <SectionLabel index={3} left="Explore" right={`${NAV_ITEMS.length - 1} pages · 1 day`} />
            <h2 id="explore-title" data-reveal>
              One day of <em>innovation.</em>
            </h2>
            <ul className="explore-grid">
              {EXPLORE.map((item, i) => (
                <li key={item.href} data-reveal>
                  <Link href={item.href}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <strong>{item.label}</strong>
                    <p>{item.text}</p>
                    <i aria-hidden="true">↗</i>
                  </Link>
                </li>
              ))}
            </ul>
            <NextPage current="/" />
          </article>
        </div>
        <LogoStory />
      </section>
    </>
  );
}

/** Elliptical orbit around the wordmark, split into back and front halves so it passes behind and in front. */
function Orbit({ layer }: { layer: 'back' | 'front' }) {
  const id = `nx-orbit-${layer}`;
  const path = 'M40,230 a560,150 0 1,1 1120,0 a560,150 0 1,1 -1120,0';
  return (
    <svg className={`nx-orbit nx-orbit-${layer}`} aria-hidden="true" viewBox="0 0 1200 460">
      <defs>
        <clipPath id={`${id}-clip`}>
          {layer === 'back' ? <rect x="-200" y="-260" width="1600" height="490" /> : <rect x="-200" y="230" width="1600" height="500" />}
        </clipPath>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8cea5a" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#e8e8e8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8cea5a" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <g transform="rotate(-7 600 230)" clipPath={`url(#${id}-clip)`}>
        <path d={path} fill="none" stroke="#8cea5a" strokeWidth="7" opacity="0.1" className="nx-orbit-blur" />
        <path d={path} fill="none" stroke={`url(#${id}-grad)`} strokeWidth="1.4" />
        <g className="nx-orbit-dot">
          <animateMotion path={path} dur="9s" repeatCount="indefinite" />
          <circle r="16" fill="#9cff6a" opacity="0.35" className="nx-orbit-blur" />
          <circle r="5.5" fill="#d8ffc4" />
        </g>
      </g>
    </svg>
  );
}
