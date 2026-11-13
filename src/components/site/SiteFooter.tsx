import Image from 'next/image';
import Link from 'next/link';
import { EVENT, getWhatsappLink } from '@/content/nexus';
import { Wordmark } from './Wordmark';

export function SiteFooter() {
  const whatsapp = getWhatsappLink();

  return (
    <footer className="site-footer">
      {/* Subtle ambient neon glow layers */}
      <div className="footer-glow footer-glow-top" aria-hidden="true" />
      <div className="footer-glow footer-glow-bottom" aria-hidden="true" />

      {/* Decorative top geometric border band */}
      <div className="footer-pattern-band" aria-hidden="true" />

      {/* Distinct Full-Width Top Branding Strip */}
      <div className="footer-strip">
        <div className="footer-strip-inner">
          <div className="footer-strip-brand">
            <span className="footer-strip-kicker">HOST INSTITUTION</span>
            <Image
              src="/nitte_white.png"
              alt="NMAM Institute of Technology (NMAMIT), Nitte"
              width={1628}
              height={278}
              className="strip-logo-nitte"
            />
          </div>

          <div className="footer-strip-divider" aria-hidden="true">
            <span className="strip-divider-dot" />
            <span className="strip-divider-text">SUMMIT 2026</span>
            <span className="strip-divider-dot" />
          </div>

          <div className="footer-strip-presenter">
            <div className="strip-presenter-meta">
              <span className="footer-strip-kicker">PRESENTED BY</span>
              <span className="strip-org-title">CSI Student Branch, NMAMIT</span>
              <a
                href={EVENT.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="strip-website-link"
              >
                {EVENT.website} ↗
              </a>
            </div>
            <div className="strip-logos-group">
              <div className="strip-badge-csi" title="Computer Society of India (CSI)">
                <Image
                  src="/csi.jpeg"
                  alt="Computer Society of India (CSI)"
                  width={1140}
                  height={1141}
                  className="strip-logo-csi"
                />
              </div>
              <div className="strip-badge-nexus" title="NEXUS 2026">
                <Wordmark />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative geometric pattern band separating strip from main footer */}
      <div className="footer-pattern-band" aria-hidden="true" />

      {/* Main 4-Column Footer Content */}
      <div className="footer-main">
        <div className="footer-grid">
          {/* Column 1 – NEXUS Branding (~32% width) */}
          <div className="footer-col-brand">
            <div className="footer-brand-header">
              <span className="footer-brand-badge">ANNUAL CHAPTER SUMMIT</span>
              <div className="footer-brand-title-row">
                <Wordmark />
              </div>
            </div>

            <p className="footer-brand-desc">{EVENT.subtitle}</p>

            {/* Structured Info Cards: Date & Campus Location */}
            <div className="footer-info-cards">
              <div className="footer-info-card">
                <div className="footer-info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </div>
                <div className="footer-info-content">
                  <span className="footer-info-label">DATE</span>
                  <time dateTime={EVENT.eventDateIso} className="footer-info-value">
                    {EVENT.eventDateDisplay}
                  </time>
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/TDpwqpZGjC46MM8s9"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-info-card footer-info-card-link"
              >
                <div className="footer-info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="footer-info-content">
                  <span className="footer-info-label">CAMPUS LOCATION</span>
                  <span className="footer-info-value">
                    NMAM Institute of Technology<br />Nitte, Karnataka 574110
                  </span>
                </div>
              </a>
            </div>

            {/* Styled Google Maps Embed */}
            <div className="footer-map-card">
              <iframe
                title="Map showing NMAM Institute of Technology, Nitte"
                src="https://www.google.com/maps?q=13.1834702%2C74.9339913&z=16&output=embed"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            {/* Social Media Icons (Consistent Bordered Square Containers) */}
            <div className="footer-socials-row" aria-label="Social media links">
              <a
                href={EVENT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${EVENT.instagram}`}
                className="footer-social-btn"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
                </svg>
              </a>

              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join the NEXUS WhatsApp group"
                  className="footer-social-btn"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" />
                    <path d="M8.6 8.2c.4 3 2.4 5 5.4 6.1l1.2-1.2 2 .9c-.2 1.1-1.1 1.9-2.2 1.8-4.1-.5-7.2-3.7-7.7-7.7-.1-1.1.7-2 1.8-2.2l.9 2-1.4.3Z" />
                  </svg>
                </a>
              )}

              <a
                href={EVENT.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`CSI NMAMIT website ${EVENT.website}`}
                className="footer-social-btn"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 – EVENT */}
          <nav className="footer-col-nav" aria-label="Event">
            <h3 className="footer-nav-heading">EVENT</h3>
            <div className="footer-nav-list">
              <Link href="/#about" className="footer-nav-link">About NEXUS</Link>
              <Link href="/schedule" className="footer-nav-link">Event schedule</Link>
              <Link href="/panel" className="footer-nav-link">Industry panel</Link>
              <Link href="/showcase" className="footer-nav-link">Branch showcase</Link>
              <Link href="/expo" className="footer-nav-link">Project expo</Link>
            </div>
          </nav>

          {/* Column 3 – PARTICIPATE */}
          <nav className="footer-col-nav" aria-label="Participate">
            <h3 className="footer-nav-heading">PARTICIPATE</h3>
            <div className="footer-nav-list">
              <Link href="/register" className="footer-nav-link">Register now</Link>
              <Link href="/expo" className="footer-nav-link">Expo details</Link>
              <Link href="/showcase" className="footer-nav-link">Branch showcase details</Link>
              {EVENT.brochureUrl && (
                <a href={EVENT.brochureUrl} download className="footer-nav-link">Download brochure</a>
              )}
            </div>
          </nav>

          {/* Column 4 – CONNECT */}
          <div className="footer-col-nav footer-col-connect">
            <h3 className="footer-nav-heading">CONNECT</h3>
            <div className="footer-nav-list">
              <Link href="/contact" className="footer-nav-link">Contact the team</Link>
              <a href={EVENT.instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                Instagram ↗
              </a>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                  WhatsApp group ↗
                </a>
              )}
              <a href={EVENT.websiteUrl} target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                {EVENT.website} ↗
              </a>
            </div>
          </div>
        </div>

        {/* Full-Width Horizontal Divider */}
        <div className="footer-bottom-divider" />

        {/* Bottom Copyright Strip */}
        <div className="footer-bottom-strip">
          <div className="footer-copyright-text">
            © 2026 NEXUS · {EVENT.organiser}. All rights reserved.
          </div>
          <div className="footer-bottom-meta">
            <span className="footer-tagline-text">{EVENT.tagline}</span>
            <span className="footer-bottom-dot" aria-hidden="true">•</span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/?intro=1" className="footer-replay-link">
              Replay intro ↻
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
