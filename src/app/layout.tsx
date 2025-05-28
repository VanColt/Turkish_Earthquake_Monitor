import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import Ant Design styles
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Turkish Earthquake Monitor",
  description: "Real-time earthquake data visualization for Turkey",
  keywords: ["earthquake", "turkey", "monitor", "dashboard", "real-time", "seismic"],
};

// Add suppressHydrationWarning to prevent hydration mismatch errors
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased bg-gray-900 text-gray-100" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
