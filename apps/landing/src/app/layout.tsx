import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-ibm-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "VibeAff - Democratize Affiliate Marketing",
  description: "Launch affiliate programs fast with data-backed targeting, channel-specific creatives, and verified payouts.",
  metadataBase: new URL("https://vibeaff.com"),
  openGraph: {
    title: "VibeAff - Democratize Affiliate Marketing",
    description: "Launch affiliate programs fast with data-backed targeting, channel-specific creatives, and verified payouts.",
    url: "https://vibeaff.com",
    siteName: "VibeAff",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeAff - Democratize Affiliate Marketing",
    description: "Launch affiliate programs fast with data-backed targeting, channel-specific creatives, and verified payouts.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://vibeaff.com",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
