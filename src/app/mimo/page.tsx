import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/phase2/Icons';
import { Wordmark } from '@/components/site/Wordmark';
import './mimo.css';

export const metadata: Metadata = {
  title: 'Mimo',
  robots: { index: false, follow: false },
};

const portals: { href: string; label: string; description: string; icon: IconName }[] = [
  { href: '/admin', label: 'Admin Panel', description: 'Manage registrations, jury assignments and results.', icon: 'grid' },
  { href: '/jury', label: 'Jury', description: 'See your panel’s timer and submit scores and comments.', icon: 'jury' },
  { href: '/volunteer', label: 'Volunteer', description: 'Run the stage timer and show the .xyz QR code.', icon: 'timer' },
  { href: '/leader', label: 'Leaderboards', description: 'View team rankings and scores by panel.', icon: 'podium' },
];

export default function MimoPage() {
  return (
    <div className="form-shell mimo">
      <header className="form-top">
        <Wordmark />
      </header>
      <main id="main" tabIndex={-1} className="mimo-main">
        <div className="form-intro">
          <h1>NEXUS <em>portals.</em></h1>
          <p>Choose your role for the Student Project Expo.</p>
        </div>
        <nav aria-label="NEXUS portals" className="mimo-nav">
          {portals.map(({ href, label, description, icon }) => (
            <Link key={href} href={href} className="mimo-link">
              <span className="mimo-icon"><Icon name={icon} size={24} /></span>
              <span className="mimo-copy">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <Icon name="next" size={20} />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
