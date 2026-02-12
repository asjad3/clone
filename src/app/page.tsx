import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { areas } from "@/data/areas";
import { stores } from "@/data/stores";
import { getCachedAreaStats } from "@/lib/cache";
import dynamic from "next/dynamic";

// Dynamic import with loading fallback — code splitting technique
const HomeClient = dynamic(() => import("./HomeClient"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#E5A528" }} />
    </div>
  ),
});

// ISR: Revalidate homepage every 1 hour
export const revalidate = 3600;

// Viewport export (Next.js 14+ pattern)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E5A528",
};

// Enhanced metadata with structured data
export const metadata: Metadata = {
  title: "LootMart — Your Neighborhood Grocery Delivery",
  description:
    "Order groceries from your local stores with same-day delivery. Get loot from your nearby marts!",
  keywords: ["grocery delivery", "online grocery", "LootMart", "same-day delivery", "Pakistan"],
  openGraph: {
    title: "LootMart",
    description: "Get loot from your nearby marts!",
    type: "website",
    locale: "en_PK",
    siteName: "LootMart",
  },
  twitter: {
    card: "summary_large_image",
    title: "LootMart",
    description: "Get loot from your nearby marts!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://www.lootmart.com.pk",
  },
};

// JSON-LD Structured Data for SEO
function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: "LootMart",
    url: "https://www.lootmart.com.pk",
    description: "Get loot from your nearby marts!",
    areaServed: areas.map((a) => ({ "@type": "City", name: a.city })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Grocery Products",
      itemListElement: stores.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Product", name: s.name },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function HomePage() {
  // Server-side data fetch with unstable_cache
  const areasWithStats = await getCachedAreaStats();

  return (
    <>
      <JsonLd />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#E5A528" }} />
          </div>
        }
      >
        <HomeClient areas={areasWithStats} stores={stores} />
      </Suspense>
    </>
  );
}
