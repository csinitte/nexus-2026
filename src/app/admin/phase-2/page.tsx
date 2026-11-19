import type { Metadata } from 'next';
import { Phase2Dashboard } from '@/components/phase2/Phase2Dashboard';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Event day console (preview)',
  robots: { index: false, follow: false },
};

export default function Phase2AdminPage() {
  return <Phase2Dashboard />;
}
