import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Unbounded } from 'next/font/google';
import { EVENT } from '@/content/nexus';
import { CursorGlow } from '@/components/site/CursorGlow';
import './globals.css';

/* Typography from the NEXUS landing design: Unbounded display, Inter body, JetBrains Mono labels. */
const display = Unbounded({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
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
  themeColor: '#121212',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <CursorGlow />
        {children}
      </body>
    </html>
  );
}
