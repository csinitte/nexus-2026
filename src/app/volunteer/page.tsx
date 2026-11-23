import type { Metadata } from 'next';
import { VolunteerPortal } from '@/components/phase2/VolunteerPortal';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Volunteer Timer | NEXUS 2026',
  robots: { index: false, follow: false },
};

export default function VolunteerPage() {
  return <VolunteerPortal />;
}

