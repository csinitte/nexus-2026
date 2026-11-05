import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NEXUS 2026 | CSI Student Summit', description: 'Connecting chapters and inspiring innovation at NMAMIT, Nitte.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
