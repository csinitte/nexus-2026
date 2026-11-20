import type { Metadata } from 'next';
import { JuryPortal } from '@/components/phase2/JuryPortal';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Jury portal (preview)',
  robots: { index: false, follow: false },
};

export default function JuryPage() {
  return <JuryPortal />;
}
