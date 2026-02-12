import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import WhatsAppBubble from "@/components/WhatsAppBubble";

// Load same fonts as live lootmart.com.pk
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Static metadata for the root layout
export const metadata: Metadata = {
  title: {
    default: "LootMart",
    template: "%s | LootMart",
  },
  description: "Get loot from your nearby marts!",
  icons: {
    icon: [
      { url: "https://www.lootmart.com.pk/favicon.ico", type: "image/x-icon", sizes: "32x32" },
    ],
  },
  metadataBase: new URL("https://www.lootmart.com.pk"),
  openGraph: {
    title: "LootMart",
    description: "Get loot from your nearby marts!",
    siteName: "LootMart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LootMart",
    description: "Get loot from your nearby marts!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <WhatsAppBubble />
        </Providers>

        {/* Google Analytics - same GA ID as live site */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DDLFHH4EQP"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DDLFHH4EQP');
          `}
        </Script>
      </body>
    </html>
  );
}
