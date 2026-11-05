import Link from 'next/link';
import { NAV_ITEMS } from '@/content/nexus';

/** Numbered rule above each section, e.g. "02 / The programme — 25 November 2026". */
export function SectionLabel({ index, left, right }: { index: number; left: string; right?: string }) {
  return (
    <div className="section-label" data-reveal>
      <span>
        {String(index).padStart(2, '0')} / {left}
      </span>
      {right && <span>{right}</span>}
    </div>
  );
}

/** Editorial page header used at the top of each information page. */
export function PageIntro({
  index,
  label,
  meta,
  eyebrow,
  title,
  accent,
  children,
}: {
  index: number;
  label: string;
  meta?: string;
  eyebrow: string;
  title: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-intro">
      <SectionLabel index={index} left={label} right={meta} />
      <p className="eyebrow" data-reveal>
        <span className="dot" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 data-reveal>
        {title} <em>{accent}</em>
      </h1>
      {children && (
        <div className="page-intro-body" data-reveal>
          {children}
        </div>
      )}
    </header>
  );
}

/** Follows the fixed PRD page order; the last information page points to registration. */
export function NextPage({ current }: { current: string }) {
  const i = NAV_ITEMS.findIndex((item) => item.href === current);
  const next = NAV_ITEMS[i + 1] ?? { href: '/register', label: 'Register Now' };
  return (
    <Link className="next-page" href={next.href} data-reveal>
      <span>Next</span>
      <strong>
        {next.label} <span aria-hidden="true">→</span>
      </strong>
    </Link>
  );
}
