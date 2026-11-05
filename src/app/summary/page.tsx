import type { Metadata } from 'next';
import Link from 'next/link';
import { SummaryView } from '@/components/summary/SummaryView';
import { Wordmark } from '@/components/site/Wordmark';

export const metadata: Metadata = {
  title: 'Registration summary',
  robots: { index: false, follow: false },
};

export default function SummaryPage() {
  return (
    <div className="form-shell">
      <header className="form-top no-print">
        <Wordmark />
        <Link className="back-link" href="/">
          <span aria-hidden="true">←</span> Back to the summit
        </Link>
      </header>
      <main id="main" tabIndex={-1}>
        <SummaryView />
      </main>
    </div>
  );
}
