import type { Metadata } from 'next'
import { Cormorant_Garamond, IBM_Plex_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Schedule a meeting — available Tuesdays and Thursdays, 10 AM – 4 PM.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${ibmMono.variable} ${dmSans.variable}`}>
      <body className="bg-ink text-ivory font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
