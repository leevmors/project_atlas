import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import VersionCheck from '@/components/version-check'
import './globals.css'

const geist = Geist({ subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ subsets: ["latin"], display: 'swap' });
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ['italic'],
  variable: '--font-cursive',
  display: 'swap',
});

// Suppress unused variable warnings — fonts are loaded for CSS availability
void geist;
void geistMono;

export const metadata: Metadata = {
  title: 'Project Atlas | Lingua HQ Leaderboard',
  description: 'Live leaderboard for student translation companies competing in Lingua HQ',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${playfair.variable}`}>
        {children}
        <VersionCheck />
        <Analytics />
      </body>
    </html>
  )
}
