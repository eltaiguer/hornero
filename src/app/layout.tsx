import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'

export const metadata: Metadata = {
  title: 'Hornero',
  description: 'Household finance management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hornero',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
