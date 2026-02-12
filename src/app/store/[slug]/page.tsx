import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stores } from "@/data/stores";
import { getCachedProducts, getCachedStore } from "@/lib/cache";
import dynamic from "next/dynamic";

// Dynamic import with code splitting
const StoreClient = dynamic(() => import("./StoreClient"), {
    loading: () => (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#E5A528" }} />
        </div>
    ),
});

// ISR: Revalidate the store page every 5 minutes
export const revalidate = 300;

// Generate static params for all stores at build time (SSG with ISR)
export async function generateStaticParams() {
    return stores.map((store) => ({
        slug: store.slug,
    }));
}

// Dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const store = await getCachedStore(slug);
    if (!store) return { title: "Store Not Found" };

    return {
        title: `${store.name} — Order Groceries Online | LootMart`,
        description: `Shop from ${store.name}. ${store.same_day_delivery ? "Same-day delivery available. " : ""
            }Delivery charges: Rs. ${store.delivery_charges}. Free delivery on orders over Rs. ${store.free_delivery_threshold
            }. ${store.productCount} products available.`,
        openGraph: {
            title: `${store.name} | LootMart`,
            description: `Order groceries from ${store.name} with fast delivery`,
            type: "website",
        },
    };
}

export default async function StorePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Parallel data fetching with unstable_cache
    const [store, productData] = await Promise.all([
        getCachedStore(slug),
        getCachedProducts(slug, 0, 8),
    ]);

    if (!store) {
        notFound();
    }

    const featuredProducts = productData.products.slice(0, 5);

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#E5A528" }} />
                </div>
            }
        >
            <StoreClient
                store={store}
                initialProducts={productData.products}
                featuredProducts={featuredProducts}
            />
        </Suspense>
    );
}
