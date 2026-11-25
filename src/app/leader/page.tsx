import type { Metadata } from 'next';
import { LeaderboardView } from '@/components/phase2/LeaderboardView';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Panel-based ranking',
  robots: { index: false, follow: false },
};

export default function LeaderPage() {
  return <LeaderboardView />;
}
