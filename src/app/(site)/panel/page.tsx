import type { Metadata } from 'next';
import PanelClient from './_panel-client';
import { PANEL, SCHEDULE } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'Industry Panel Discussion',
  description: `${PANEL.topic} — an industry panel discussion at NEXUS 2026.`,
};

const slot = SCHEDULE.find((s) => s.href === '/panel');

export default function PanelPage() {
  return <PanelClient slot={slot} />;
}
