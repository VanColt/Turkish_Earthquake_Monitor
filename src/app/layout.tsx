import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Turkish Earthquake Monitor',
  description: 'Real-time earthquake data for Turkey, sourced from Kandilli Observatory.',
  keywords: ['earthquake', 'turkey', 'kandilli', 'seismic', 'monitor', 'real-time'],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
