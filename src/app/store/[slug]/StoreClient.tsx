"use client";

import { useState, useCallback } from "react";
import { Clock, Truck, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ProductGrid from "@/components/ProductGrid";
import CartSidebar, { MobileCartBar } from "@/components/CartSidebar";
import { Product, Store } from "@/types";

interface StoreClientProps {
    store: Store;
    initialProducts: Product[];
    featuredProducts: Product[];
}

export default function StoreClient({
    store,
    initialProducts,
    featuredProducts,
}: StoreClientProps) {
    const [cartOpen, setCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    return (
        <>
            <Header
                variant="store"
                storeName={store.name}
                sameDayDelivery={store.same_day_delivery}
                onCartToggle={() => setCartOpen(true)}
            />

            <main className="pb-16 md:pb-0">
                {/* Store Info Bar */}
                <div className="border-b border-gray-100 bg-white">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        <div className="flex flex-wrap gap-3">
                            <div className="info-block info-block-dark flex items-center gap-3">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-xs opacity-80">Store Hours</div>
                                    <div className="text-sm font-semibold">{store.store_hours}</div>
                                </div>
                            </div>
                            <div className="info-block info-block-orange flex items-center gap-3">
                                <Truck className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-xs opacity-80">Delivery Hours</div>
                                    <div className="text-sm font-semibold">{store.delivery_hours}</div>
                                </div>
                            </div>
                            <div className="info-block info-block-light flex items-center gap-3">
                                <CreditCard className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-xs opacity-80">Delivery Charges</div>
                                    <div className="text-sm font-semibold">
                                        Rs. {store.delivery_charges} (Free over Rs. {store.free_delivery_threshold})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured Carousel */}
                {featuredProducts.length > 0 && !searchQuery && (
                    <div className="max-w-6xl mx-auto px-4 py-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Featured Products</h2>
                        <FeaturedCarousel products={featuredProducts} />
                    </div>
                )}

                {/* Search */}
                <SearchBar storeName={store.name} onSearch={handleSearch} />

                {/* Product Grid with Infinite Scroll */}
                <ProductGrid
                    initialProducts={initialProducts}
                    storeSlug={store.slug}
                    searchQuery={searchQuery}
                />
            </main>

            {/* Cart */}
            <CartSidebar
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                store={store}
            />
            <MobileCartBar store={store} onOpen={() => setCartOpen(true)} />
        </>
    );
}
