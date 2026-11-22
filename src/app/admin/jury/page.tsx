import type { Metadata } from 'next';
import { JuryAdmin } from '@/components/phase2/JuryAdmin';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Jury control (preview)',
  robots: { index: false, follow: false },
};

export default function JuryAdminPage() {
  return <JuryAdmin />;
}
