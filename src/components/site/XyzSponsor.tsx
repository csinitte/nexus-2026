import Image from 'next/image';
import { XYZ_SPONSOR } from '@/content/xyz-sponsor';
import './xyz-sponsor.css';

export function XyzSponsorLogo() {
  return (
    <a className="xyz-sponsor-logo" href={XYZ_SPONSOR.website} aria-label="Visit the .xyz Registry">
      <Image src="/brand/xyz-logo-color.png" alt=".xyz" width={301} height={176} sizes="116px" />
    </a>
  );
}

export function XyzSponsor() {
  return (
    <aside className="xyz-sponsor" aria-label="NEXUS domain sponsor">
      <XyzSponsorLogo />
      <div className="xyz-sponsor-copy">
        <p className="xyz-sponsor-label">Official domain sponsor</p>
        <h2>A free first-year .xyz domain</h2>
        <p>For NEXUS 2026 participants, while the sponsored domains last.</p>
      </div>
    </aside>
  );
}
