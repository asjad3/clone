import { Metadata } from "next";
import StorePageClient from "@/components/StorePageClient";
import { stores } from "@/lib/data";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = stores.find((s) => s.slug === slug);
  return {
    title: store ? `${store.name} - LootMart` : "Store - LootMart",
    description: store ? `Shop from ${store.name} on LootMart. Fast grocery delivery.` : "Shop groceries on LootMart.",
  };
}

export function generateStaticParams() {
  return stores.map((store) => ({ slug: store.slug }));
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  return <StorePageClient slug={slug} />;
}
