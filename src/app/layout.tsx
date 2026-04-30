import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Portal Akuisisi Merchant | Bank Mandiri',
  description: 'Platform akuisisi merchant EDC & QRIS Bank Mandiri',
  manifest: '/manifest.json',
  themeColor: '#003B79',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#00A651', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#E53935', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
