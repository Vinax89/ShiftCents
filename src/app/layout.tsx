import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';
import PushInit from './push-init';
import { SessionProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'ShiftCents',
  description: 'Finance app for shift workers',
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <Providers>
          <SessionProvider>
            {children}
          </SessionProvider>
        </Providers>
        <Toaster />
        <PushInit />
      </body>
    </html>
  );
}
