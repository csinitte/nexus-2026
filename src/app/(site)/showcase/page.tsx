import type { Metadata } from 'next';
import ShowcaseClient from './_showcase-client';
import { SHOWCASE, SCHEDULE } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'CSI Chapter Showcase',
  description: `${SHOWCASE.tagline} Five-minute presentations from CSI student chapters across Karnataka at NEXUS 2026.`,
};

const slot = SCHEDULE.find((s) => s.href === '/showcase');

export default function ShowcasePage() {
  return <ShowcaseClient slot={slot} />;
}
