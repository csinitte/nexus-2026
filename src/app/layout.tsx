import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight } from 'next/font/google';
import { EVENT } from '@/content/nexus';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXUS_PUBLIC_URL || 'https://csinmamit.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${EVENT.name} | ${EVENT.subtitle}`,
    template: `%s | ${EVENT.name}`,
  },
  description: `${EVENT.tagline} ${EVENT.subtitle} on ${EVENT.eventDateDisplay} at ${EVENT.hostInstitution}, hosted by ${EVENT.organiser}.`,
  applicationName: EVENT.name,
  openGraph: {
    type: 'website',
    siteName: EVENT.name,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#090b0a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
