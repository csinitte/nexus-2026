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
