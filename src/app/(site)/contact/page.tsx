import type { Metadata } from 'next';
import { NextPage, PageIntro } from '@/components/site/PageParts';
import { CONTACT, EVENT, getWhatsappLink } from '@/content/nexus';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Questions about NEXUS 2026? Reach the CSI NMAMIT organising team.',
};

export default function ContactPage() {
  const whatsapp = getWhatsappLink();
  return (
    <section className="section page contact-page">
      <PageIntro
        index={6}
        label="Get in touch"
        meta="Contact details"
        eyebrow="Have questions about NEXUS 2026?"
        title="Stay"
        accent="connected."
      >
        <p>{CONTACT.intro}</p>
      </PageIntro>

      <div className="contact-whatsapp" data-reveal>
        <div>
          <h2>Join the NEXUS 2026 WhatsApp group</h2>
          <p>Stay connected with the NEXUS community.</p>
        </div>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            Join the group <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span>Group link coming soon.</span>
        )}
      </div>

      <div className="contact-grid">
        <div data-reveal>
          <h2 className="list-title">Organising team</h2>
          <ul className="contact-list">
            {CONTACT.people.map((p) => (
              <li key={p.tel}>
                <strong>{p.name}</strong>
                <a href={`tel:${p.tel}`}>
                  {p.phone} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal>
          <h2 className="list-title">Connect with us</h2>
          <ul className="contact-list">
            <li>
              <strong>Instagram</strong>
              <a href={EVENT.instagramUrl} target="_blank" rel="noopener noreferrer">
                {EVENT.instagram} <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <strong>Website</strong>
              <a href={EVENT.websiteUrl} target="_blank" rel="noopener noreferrer">
                {EVENT.website} <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="closing" data-reveal>
        <p>{CONTACT.closing}</p>
        <span>{CONTACT.farewell}</span>
      </div>
      <NextPage current="/contact" />
    </section>
  );
}
