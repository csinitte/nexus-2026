import type { Metadata } from 'next';
import { PageIntro } from '@/components/site/PageParts';
import { CertificateLookup } from '@/components/phase2/CertificateLookup';
import { PreviewBanner } from '@/components/phase2/PreviewBanner';
import '@/components/phase2/phase2.css';

export const metadata: Metadata = {
  title: 'Certificates (preview)',
  robots: { index: false, follow: false },
};

export default function CertificatesPage() {
  return (
    <section className="section page">
      <PreviewBanner note="Any ID like NEXUS26-1234 returns sample certificates" />
      <PageIntro index={9} label="After the summit" meta="Participants & winners" eyebrow="Certificates" title="Your NEXUS" accent="certificate.">
        <p>Enter the registration ID from your confirmation email to view and download the certificates for your delegation.</p>
      </PageIntro>
      <CertificateLookup />
    </section>
  );
}
