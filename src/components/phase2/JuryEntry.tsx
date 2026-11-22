import Link from 'next/link';
import './jury-entry.css';

/** Quiet entry point for judges, shown near the top of the Project Expo page. */
export function JuryEntry() {
  return (
    <aside className="jury-entry" aria-label="Jury access">
      <span className="jury-entry-mark" aria-hidden="true" />
      <p>
        <span className="jury-entry-label">For the jury</span>
        Judging the Student Project Expo? Sign in with the login the organisers sent you.
      </p>
      <Link className="text-link jury-entry-link" href="/jury">
        Jury login <span aria-hidden="true">↗</span>
      </Link>
    </aside>
  );
}
