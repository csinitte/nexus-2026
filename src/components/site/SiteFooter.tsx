import Link from 'next/link';
import { EVENT, NAV_ITEMS } from '@/content/nexus';
import { Wordmark } from './Wordmark';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Wordmark />
          <p>{EVENT.subtitle}</p>
          <a
            className="footer-location"
            href="https://www.google.com/maps/search/?api=1&query=NMAM+Institute+of+Technology+Nitte+Karnataka"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NMAMIT location on Google Maps"
          >
            <svg className="footer-location-icon" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>
              <strong>NMAM Institute of Technology (NMAMIT)</strong>
              <br />
              Nitte, Karkala, Udupi District, Karnataka, India
            </span>
          </a>
        </div>
        <nav aria-label="Footer">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/register">Register</Link>
        </nav>
        <div className="footer-links">
          <a href={EVENT.instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram {EVENT.instagram} <span aria-hidden="true">↗</span>
          </a>
          <a href={EVENT.websiteUrl} target="_blank" rel="noopener noreferrer">
            {EVENT.website} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Hosted by {EVENT.organiser}</span>
        <span>
          <time dateTime={EVENT.eventDateIso}>{EVENT.eventDateDisplay}</time> · {EVENT.venueShort}
        </span>
        <Link href="/?intro=1">Replay intro ↻</Link>
      </div>
    </footer>
  );
}
