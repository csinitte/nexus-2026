import type { Metadata } from 'next';
import Link from 'next/link';
import { ResultsShowcase } from '@/components/phase2/ResultsShowcase';
import { PageIntro } from '@/components/site/PageParts';
import { PreviewBanner } from '@/components/phase2/PreviewBanner';
import { MAX_TOTAL, mockWinners } from '@/components/phase2/mock';
import { EVENT } from '@/content/nexus';
import { PRIZE_PARTS, PRIZE_TOTAL, formatRupees } from '@/data/prizes';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Project Expo results (preview)',
  robots: { index: false, follow: false },
};

type Winner = ReturnType<typeof mockWinners>[number];

/** Plain, serialisable shape for the client reveal. */
function toEntry({ prize, project }: Winner) {
  return {
    rank: prize.rank,
    amount: prize.amount,
    project: project && {
      title: project.title,
      college: project.college,
      category: project.category,
      teamSize: project.team.length,
      average: project.average,
    },
  };
}

export default function ResultsPage() {
  const winners = mockWinners();
  const [champion, ...ranked] = winners.filter((w) => !w.prize.special);
  const specials = winners.filter((w) => w.prize.special);

  return (
    <section className="section page p2-results">
      <PreviewBanner note="Mock winners — real results appear after the jury publishes them" />
      <PageIntro
        index={7}
        label="Student Project Expo"
        meta={EVENT.eventDateDisplay}
        eyebrow="Results announced"
        title="The"
        accent="winners."
      >
        <p>
          Every team that exhibited at NEXUS built something worth seeing. These are the projects the jury picked from
          the Student Project Expo.
        </p>
      </PageIntro>

      <div className="schedule-timeline-intro" data-reveal>
        <div>
          <p className="eyebrow">Technology for a sustainable future</p>
          <h2>
            Ranked by <em>the jury.</em>
          </h2>
        </div>
        <p>
          <strong>{String(PRIZE_PARTS.length).padStart(2, '0')}</strong> awards <span aria-hidden="true">/</span>{' '}
          {formatRupees(PRIZE_TOTAL)} in prizes
        </p>
      </div>

      {champion && (
        <ResultsShowcase
          maxTotal={MAX_TOTAL}
          champion={toEntry(champion)}
          runnersUp={ranked.map(toEntry)}
          specials={specials.map(toEntry)}
        />
      )}

      <div className="callout" data-reveal>
        <div>
          <p className="eyebrow">Certificates are ready</p>
          <p>Every participant gets one. Find yours with the registration ID from your confirmation email.</p>
        </div>
        <Link className="button" href="/certificates">
          Get your certificate <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
