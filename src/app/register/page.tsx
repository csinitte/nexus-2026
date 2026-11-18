import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/register/RegisterForm';
import { Wordmark } from '@/components/site/Wordmark';
import { EVENT } from '@/content/nexus';

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
                  <strong>Multiple teams</strong>
                  <span>are welcome from the same college; each registration counts its students separately</span>
                </li>
                <li>
                  <strong>Optional Expo</strong>
                  <span>teams of 2–5 students · PDF abstract due {EVENT.abstractDeadlineDisplay}</span>
                </li>
                <li>
                  <strong>Saved on this device</strong>
                  <span>your registration progress is saved until submission</span>
                </li>
              </ul>
            </div>
          }
        />
      </main>
    </div>
  );
}
