import Image from 'next/image';
import Link from 'next/link';
import { EVENT, getWhatsappLink } from '@/content/nexus';
import { Wordmark } from './Wordmark';

export function SiteFooter() {
  const whatsapp = getWhatsappLink();

  return (
    <footer className="site-footer">
      {/* Decorative top geometric border band (matching reference style) */}
      <div className="footer-pattern-band" aria-hidden="true" />

      {/* Top Branding Strip */}
      <div className="footer-strip">
        <div className="footer-strip-inner">
          <div className="footer-strip-left">
            <Image
              src="/nitte_white.png"
              alt="NMAM Institute of Technology (NMAMIT), Nitte"
              width={1628}
              height={278}
              className="strip-logo-nitte"
            />
          </div>
          <div className="footer-strip-right">
            <div className="strip-presenter">
              <span className="strip-label">PRESENTED BY</span>
              <span className="strip-org">CSI Student Chapter, NMAMIT</span>
              <a
                href={EVENT.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="strip-link"
              >
                {EVENT.website} ↗
              </a>
            </div>
            <div className="strip-badges">
              <div className="strip-badge-csi" title="Computer Society of India">
                <Image
                  src="/csi.jpeg"
                  alt="Computer Society of India (CSI)"
                  width={1140}
                  height={1141}
                  className="strip-logo-csi"
                />
              </div>
              <div className="strip-badge-nexus">
                <Wordmark />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom geometric border band */}
      <div className="footer-pattern-band" aria-hidden="true" />

      {/* Main Multi-Column Footer Content */}
      <div className="footer-main">
        <div className="footer-top">
          {/* Column 1: Brand & Details */}
          <div className="footer-brand">
            <div className="footer-brand-title-wrap">
              <span className="footer-kicker">CSI SUMMIT 2026</span>
              <h2 className="footer-brand-title">NEXUS</h2>
            </div>
            <p className="footer-desc">{EVENT.subtitle}</p>

            <div className="footer-details">
              <div className="footer-detail-item">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
                <time dateTime={EVENT.eventDateIso}>{EVENT.eventDateDisplay}</time>
              </div>
              <a
                href="https://maps.app.goo.gl/TDpwqpZGjC46MM8s9"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-detail-item footer-address-link"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>NMAM Institute of Technology<br />Nitte, Karnataka 574110</span>
              </a>
            </div>

            <div className="footer-map">
              <iframe
                title="Map showing NMAM Institute of Technology, Nitte"
                src="https://www.google.com/maps?q=13.1834702%2C74.9339913&z=16&output=embed"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="footer-socials" aria-label="Social links">
              <a href={EVENT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${EVENT.instagram}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
                </svg>
              </a>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Join the NEXUS WhatsApp group">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" />
                    <path d="M8.6 8.2c.4 3 2.4 5 5.4 6.1l1.2-1.2 2 .9c-.2 1.1-1.1 1.9-2.2 1.8-4.1-.5-7.2-3.7-7.7-7.7-.1-1.1.7-2 1.8-2.2l.9 2-1.4.3Z" />
                  </svg>
                </a>
              )}
              <a href={EVENT.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`CSI NMAMIT website ${EVENT.website}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Event */}
          <nav className="footer-column" aria-label="Event">
            <h3 className="footer-col-heading">EVENT</h3>
            <Link href="/#about">About NEXUS</Link>
            <Link href="/schedule">Event schedule</Link>
            <Link href="/panel">Industry panel</Link>
            <Link href="/showcase">Chapter showcase</Link>
            <Link href="/expo">Project expo</Link>
          </nav>

          {/* Column 3: Participate */}
          <nav className="footer-column" aria-label="Participate">
            <h3 className="footer-col-heading">PARTICIPATE</h3>
            <Link href="/register">Register now</Link>
            <Link href="/expo">Expo details</Link>
            <Link href="/showcase">Showcase details</Link>
            {EVENT.brochureUrl && <a href={EVENT.brochureUrl} download>Download brochure</a>}
          </nav>

          {/* Column 4: Connect */}
          <div className="footer-column footer-connect">
            <h3 className="footer-col-heading">CONNECT</h3>
            <Link href="/contact">Contact the team</Link>
            <a href="https://www.instagram.com/csi_nmamit/" target="_blank" rel="noopener noreferrer">Instagram @csi_nmamit</a>
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp group ↗</a>}
            <a href={EVENT.websiteUrl} target="_blank" rel="noopener noreferrer">{EVENT.website} ↗</a>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div className="footer-divider" />

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <span className="footer-copyright">
            © 2026 NEXUS · {EVENT.organiser}. All rights reserved.
          </span>
          <div className="footer-bottom-right">
            <span className="footer-tagline-text">{EVENT.tagline}</span>
            <span className="footer-bottom-sep" aria-hidden="true">·</span>
            {/* Reload so the intro remounts even when already on the homepage. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/?intro=1" className="footer-replay-link">Replay intro ↻</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
