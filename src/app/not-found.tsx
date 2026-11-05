import Link from 'next/link';
import { Wordmark } from '@/components/site/Wordmark';

export default function NotFound() {
  return (
    <main id="main" className="form-shell not-found">
      <div className="form-top">
        <Wordmark />
      </div>
      <p className="eyebrow">Error 404</p>
      <h1>
        Signal <em>lost.</em>
      </h1>
      <p className="muted">The page you were looking for doesn’t exist or has moved.</p>
      <div className="hero-ctas">
        <Link className="button" href="/">
          Back to NEXUS <span aria-hidden="true">↗</span>
        </Link>
        <Link className="button outline" href="/register">
          Register now
        </Link>
      </div>
    </main>
  );
}
