import Image from 'next/image';
import Link from 'next/link';
import { IntroGate } from '@/components/intro/IntroGate';
import { LogoStory } from '@/components/story/LogoStory';
import { OBJECTS } from '@/components/story/shapes';
import { ABOUT, EVENT, HOSTS, getWhatsappLink } from '@/content/nexus';
import { PRIZE_PARTS, PRIZE_TOTAL, formatRupees } from '@/data/prizes';

/*
 * The home page is a deck of five full-screen pages: the hero, then About,
 * Hosts, Rewards and Innovation. A small scroll moves one page and plays the whole
 * transition (see LogoStory). Each page fits one screen; copy here is a
 * condensed version of the approved text in src/content/nexus.ts.
 */

const EXPLORE = [
  { href: '/schedule', label: 'Event Schedule', text: 'Eight sessions, from inauguration to valedictory.' },
  { href: '/panel', label: 'Industry Panel', text: 'From skills to startups with industry voices.' },
  { href: '/showcase', label: 'Chapter Showcase', text: 'Five minutes to share your chapter’s journey.' },
  { href: '/expo', label: 'Project Expo', text: 'Technology for a sustainable, smarter future.' },
];

const HOST_SUMMARY: Record<string, string> = {
  nmamit:
    'Established in 1986, NMAM Institute of Technology (NMAMIT), Nitte, is a constituent college of Nitte (Deemed to be University), Mangaluru. The university holds an A+ NAAC Grade and Category A status from the Ministry of Education. NMAMIT is ranked in the 151–200 band in NIRF 2024 for engineering institutions, with NBA Tier-I accreditation for eligible undergraduate programmes. With 6,000+ students and a 125-acre green campus, NMAMIT promotes academic excellence, research and innovation.',
  csi: 'The CSI Student Branch, NMAMIT (Branch ID: I00655), operates under the CSI Bangalore Chapter. Established in 2007, it has grown to 700+ student members and 350+ technical events, earning the Best Accredited Student Branch and Largest Student Branch Awards (2017–19).',
};

export default function HomePage() {
  const whatsapp = getWhatsappLink();
  return (
    <>
      <IntroGate />
      <section className="deck" data-deck aria-label="NEXUS 2026">
        {/* Page 0 — hero */}
        <div className="deck-hero is-active" data-deck-page="0" aria-labelledby="hero-title">
          <div className="nx-stage">
            <div className="nx-stage-inner">
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
              <div className="nx-robot">
                <Image src="/brand/robot.png" alt="" width={772} height={841} priority sizes="(max-width: 700px) 70vw, 36vw" />
                <Image
                  className="nx-pulse"
                  src="/brand/robot-glow.png"
                  alt=""
                  width={772}
                  height={841}
                  sizes="(max-width: 700px) 70vw, 36vw"
                />
              </div>
            </div>
          </div>

          <div className="hero-corners" aria-label="Event hosts">
            <div className="hero-host-logo hero-host-institution">
              <Image src="/nitte_white.png" alt="Nitte (Deemed to be University) — NMAM Institute of Technology" width={1628} height={278} sizes="(max-width: 700px) 45vw, (max-width: 1400px) 25vw, 350px" />
            </div>
            <div className="hero-host-logo hero-host-chapter">
              <Image src="/csi-bangalore.png" alt="CSI Student Branch, NMAMIT — Computer Society of India Bangalore Chapter" width={1908} height={559} sizes="(max-width: 700px) 34vw, 220px" />
            </div>
          </div>

          <div className="hero-band">
            <div className="hero-copy">
              <p className="hero-subtitle">CSI Student Summit on Innovation &amp; Technology</p>
              <p className="eyebrow">
                <span className="dot" aria-hidden="true" />
                <time dateTime={EVENT.eventDateIso}>{EVENT.dateCompact}</time>
              </p>
              {EVENT.brochureUrl ? (
                <a className="hero-brochure" href={EVENT.brochureUrl} download>
                  Download brochure <span aria-hidden="true">↓</span>
                </a>
              ) : (
                <p className="hero-brochure hero-brochure-pending">Brochure coming soon</p>
              )}
              <div className="hero-ctas">
                <Link className="button" href="/register">
                  Register now <span aria-hidden="true">↗</span>
                </Link>
                <a className="button outline" href="#about" data-deck-go="1">
                  Explore NEXUS <span aria-hidden="true">↓</span>
                </a>
              </div>
              {whatsapp ? (
                <a className="hero-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <span className="hero-whatsapp-dot" aria-hidden="true" />
                  Join the NEXUS WhatsApp group <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <p className="hero-whatsapp hero-whatsapp-pending">WhatsApp group link coming soon</p>
              )}
            </div>
          </div>
        </div>

        {/* Page 1 — About NEXUS */}
        <article id="about" className="deck-page" data-deck-page="1" aria-labelledby="about-title">
          <div className="deck-side left">
            <p className="eyebrow">01 / The summit</p>
            <h2 id="about-title">
              About <em>NEXUS.</em>
            </h2>
            <p className="lead">
              A flagship summit by the CSI Student Branch, NMAMIT, bringing together CSI student branches from across Karnataka with
              faculty members and industry professionals.
            </p>
            <p className="signature">Connecting Chapters. Inspiring Innovation.</p>
          </div>
          <DeckCenter index={0} />
          <div className="deck-side right">
            <p className="deck-text">
              A common platform to exchange ideas, showcase innovation, build leadership and explore emerging technologies — through
              industry interactions, chapter presentations and project exhibitions.
            </p>
            <ul className="deck-stats" aria-label="Participation highlights">
              {ABOUT.stats.map((s) => (
                <li key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
            <p className="footnote">Proposed participation targets, not confirmed attendance.</p>
          </div>
        </article>

        {/* Page 2 — About the hosts */}
        <article id="hosts" className="deck-page" data-deck-page="2" aria-labelledby="hosts-title" tabIndex={0}>
          <h2 id="hosts-title" className="sr-only">
            About the hosts
          </h2>
          {HOSTS.map((host, i) => (
            <div key={host.id} className={`deck-side ${i === 0 ? 'left' : 'right'}`}>
              <p className="eyebrow">{i === 0 ? '02 / Host institution' : '02 / Organising chapter'}</p>
              <div className={`host-logo host-logo-${host.id}`}>
                <Image src={host.logo.src} alt={host.logo.alt} width={host.logo.width} height={host.logo.height} sizes="200px" />
              </div>
              <h3>About {host.name}</h3>
              <p className="deck-text">{HOST_SUMMARY[host.id]}</p>
              <dl className="host-facts">
                {host.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <DeckCenter index={1} />
        </article>

        {/* Page 3 — Rewards */}
        <article id="rewards" className="deck-page deck-rewards" data-deck-page="3" aria-labelledby="rewards-title" tabIndex={0}>
          <div className="deck-side left">
            <p className="eyebrow">03 / Project Expo awards</p>
            <h2 id="rewards-title">Big ideas.<br /><em>Real rewards.</em></h2>
            <p className="deck-rewards-label">Total prize pool</p>
            <p className="deck-rewards-total">{formatRupees(PRIZE_TOTAL)}</p>
            <Link href="/expo" className="deck-rewards-link">Explore the Project Expo <span aria-hidden="true">↗</span></Link>
          </div>
          <DeckCenter index={2} />
          <div className="deck-side right">
            <p className="deck-rewards-list-label">The awards</p>
            <dl className="deck-rewards-list">
              {PRIZE_PARTS.map((prize) => <div key={prize.rank}><dt>{prize.rank}</dt><dd>{formatRupees(prize.amount)}</dd></div>)}
            </dl>
          </div>
        </article>

        {/* Page 4 — One day of innovation */}
        <article id="explore" className="deck-page" data-deck-page="4" aria-labelledby="explore-title">
          <div className="deck-side left">
            <p className="eyebrow">04 / Explore</p>
            <h2 id="explore-title">
              One day of <em>innovation.</em>
            </h2>
            <DeckLinks items={EXPLORE.slice(0, 2)} start={1} />
          </div>
          <DeckCenter index={3} />
          <div className="deck-side right">
            <DeckLinks items={EXPLORE.slice(2)} start={3} />
            <Link className="button" href="/register">
              Register now <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>

        <nav className="deck-dots" aria-label="Home sections">
          {['Home', 'About NEXUS', 'The hosts', 'Rewards', 'Explore'].map((label, i) => (
            <button key={label} type="button" data-deck-go={i} aria-label={label}>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <p className="deck-hint" aria-hidden="true">
          Scroll <span>↓</span>
        </p>
        <LogoStory />
      </section>

    </>
  );
}

/** Centre column: the canvas draws the object here; the caption names it. */
function DeckCenter({ index }: { index: number }) {
  const o = OBJECTS[index];
  return (
    <div className="deck-center" data-deck-center aria-hidden="true">
      <p className="deck-caption">
        <span>/{String(index + 1).padStart(2, '0')}</span> {o.label}
      </p>
    </div>
  );
}

function DeckLinks({ items, start }: { items: typeof EXPLORE; start: number }) {
  return (
    <ul className="deck-links">
      {items.map((item, i) => (
        <li key={item.href}>
          <Link href={item.href}>
            <span>/{String(start + i).padStart(2, '0')}</span>
            <strong>{item.label}</strong>
            <small>{item.text}</small>
            <i aria-hidden="true">↗</i>
          </Link>
        </li>
      ))}
    </ul>
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


