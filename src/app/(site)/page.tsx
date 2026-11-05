import Image from 'next/image';
import Link from 'next/link';
import { NextPage, SectionLabel } from '@/components/site/PageParts';
import { Parallax } from '@/components/site/Parallax';
import { ABOUT, EVENT, HOSTS, NAV_ITEMS } from '@/content/nexus';
import robot from '../../../public/asset_robo_nobg.png';

const EXPLORE = [
  { href: '/schedule', label: 'The day at NEXUS', text: 'Eight moments, from inauguration to valedictory.' },
  { href: '/panel', label: 'Industry Panel', text: 'From skills to startups with industry voices.' },
  { href: '/showcase', label: 'Chapter Showcase', text: 'Five minutes to share your chapter’s journey.' },
  { href: '/expo', label: 'Project Expo', text: 'Technology for a sustainable, smarter future.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <Parallax className="hero-art" strength={0.1}>
          <Image src={robot} alt="" priority sizes="(max-width: 760px) 120vw, 55vw" placeholder="blur" />
        </Parallax>
        <div className="hero-shade" aria-hidden="true" />

        <div className="hero-top">
          <span>
            CSI Student Summit on
            <br />
            Innovation &amp; Technology
          </span>
        </div>

        <div className="hero-main">
          <p className="eyebrow">
            <span className="dot" aria-hidden="true" /> {EVENT.dateCompact} · {EVENT.venueShort}
          </p>
          <h1 id="hero-title">
            NEXUS
            <span className="sr-only"> 2026 — {EVENT.subtitle}</span>
          </h1>
          <p className="hero-subtitle" aria-hidden="true">
            CSI Student Summit on Innovation &amp; Technology
          </p>
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

      <section id="about" className="section about" aria-labelledby="about-title">
        <SectionLabel index={1} left="The summit" right="About NEXUS" />
        <div className="split">
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
      </section>

      <section id="hosts" className="section hosts" aria-labelledby="hosts-title">
        <SectionLabel index={2} left="The hosts" right="Hosted by CSI Student Branch, NMAMIT" />
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
      </section>

      <section className="section explore" aria-labelledby="explore-title">
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
      </section>
    </>
  );
}
