import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/register/RegisterForm';
import { Wordmark } from '@/components/site/Wordmark';
import { EVENT } from '@/content/nexus';
import { MAX_TOTAL_REPRESENTATIVES } from '@/lib/nexus/constants';

export const metadata: Metadata = {
  title: 'Register',
  description: `Register your college delegation for ${EVENT.name} on ${EVENT.eventDateDisplay} at NMAMIT, Nitte.`,
};

export default function RegisterPage() {
  return (
    <div className="form-shell">
      <header className="form-top">
        <Wordmark />
        <Link className="back-link" href="/">
          <span aria-hidden="true">←</span> Back to the summit
        </Link>
      </header>
      <main id="main" tabIndex={-1}>
        <RegisterForm
          intro={
            <div className="form-intro">
              <p className="eyebrow">
                <span className="dot" aria-hidden="true" />
                {EVENT.eventDateDisplay} · {EVENT.venueShort}
              </p>
              <h1>
                Secure your <em>spot.</em>
              </h1>
              <p className="lead">Register your college delegation for NEXUS 2026. It takes about five minutes.</p>
              <ul className="intro-facts">
                <li>
                  <strong>Max {MAX_TOTAL_REPRESENTATIVES}</strong>
                  <span>representatives per college, including the faculty coordinator if accompanying</span>
                </li>
                <li>
                  <strong>Expo</strong>
                  <span>optional · teams of 2–4 students · PDF abstract by {EVENT.abstractDeadlineDisplay}</span>
                </li>
                <li>
                  <strong>Saved</strong>
                  <span>your progress is kept on this device until you submit</span>
                </li>
              </ul>
            </div>
          }
        />
      </main>
    </div>
  );
}
