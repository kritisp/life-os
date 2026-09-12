import type { Metadata } from 'next'
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { APP_NAME, TAGLINE } from '@/lib/constants'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description: 'Gamify progress. Not guilt. A production RPG character operating system for real-life achievements.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0b0d0f] text-[#e7e8e4] font-sans selection:bg-[#d7a646]/30">
        <div className="scanlines" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
