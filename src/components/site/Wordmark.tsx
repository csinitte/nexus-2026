import Link from 'next/link';

export function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="NEXUS 2026 home">
      NEXUS<span aria-hidden="true">/26</span>
    </Link>
  );
}
