import Link from 'next/link';

/** Hexagon "N" mark and letter-spaced NEXUS, from the landing page design. */
export function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="NEXUS 2026 home">
      <svg aria-hidden="true" width="34" height="34" viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M19 2.5 L33.5 10.8 L33.5 27.2 L19 35.5 L4.5 27.2 L4.5 10.8 Z" />
        <path d="M13.5 25.5 V12.5 L24.5 25.5 V12.5" />
      </svg>
      <span aria-hidden="true">NEXUS</span>
    </Link>
  );
}
