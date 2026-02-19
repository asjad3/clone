"use client";

import { useState, useCallback, useEffect } from "react";
import { Clock, Truck, CreditCard, Store as StoreIcon, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ProductGrid from "@/components/ProductGrid";
import CartSidebar, { MobileCartBar } from "@/components/CartSidebar";
import ReviewPopup from "@/components/ReviewPopup";
import { useCartStore } from "@/store/cart";
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
    const { pendingReviewOrder, setPendingReviewOrder } = useCartStore();

    // Demo: show review popup on every page load (proof of concept)
    useEffect(() => {
        setPendingReviewOrder({
            id: "demo-ord-001",
            orderNumber: "LM00123456",
            date: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
            subtotal: 680,
            delivery: 0,
            total: 680,
            store,
            rider: {
                id: 1,
                name: "Ahmed Khan",
                photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
                phone: "+92 300 1234567",
                vehicle: "Motorcycle",
            },
            items: [
                {
                    product: {
                        id: 101,
                        name: "Fresh Milk 1L",
                        weight: "1 Liter",
                        price: 280,
                        oldPrice: null,
                        category_id: 1,
                        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
                        in_stock: true,
                        store_slug: store.slug,
                    },
                    quantity: 2,
                },
                {
                    product: {
                        id: 102,
                        name: "Whole Wheat Bread",
                        weight: "400g",
                        price: 120,
                        oldPrice: 150,
                        category_id: 2,
                        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
                        in_stock: true,
                        store_slug: store.slug,
                    },
                    quantity: 1,
                },
            ],
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                            <div className="info-block info-block-dark flex items-center gap-3">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider opacity-80">Store Hours</div>
                                    <div className="text-sm font-semibold">{store.store_hours}</div>
                                </div>
                            </div>
                            <div className="info-block info-block-orange flex items-center gap-3">
                                <Truck className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider opacity-80">Delivery Hours</div>
                                    <div className="text-sm font-semibold">{store.delivery_hours}</div>
                                </div>
                            </div>
                            <div className="info-block info-block-light flex items-center gap-3">
                                <CreditCard className="w-4 h-4 flex-shrink-0" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Delivery Fee</div>
                                    <div className="text-sm font-semibold">Rs. {store.delivery_charges}</div>
                                </div>
                            </div>
                            <div className="info-block info-block-light flex items-center gap-3">
                                <ShoppingCart className="w-4 h-4 flex-shrink-0 text-gray-600" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Free Delivery</div>
                                    <div className="text-sm font-semibold">Rs. {store.free_delivery_threshold}+</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Welcome to Store */}
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <StoreIcon className="w-6 h-6" style={{ color: "#E5A528" }} />
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                            Welcome to <span>{store.name}</span>
                        </h1>
                    </div>
                    <div className="flex items-center justify-end mb-4">
                        <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Available
                        </button>
                    </div>
                </div>

                {/* Featured Carousel */}
                {featuredProducts.length > 0 && !searchQuery && (
                    <div className="max-w-6xl mx-auto px-4 mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
                            <button className="text-sm font-medium" style={{ color: "#E5A528" }}>Popular Picks</button>
                        </div>
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

            {/* Review Popup — lives here so cart open/close state doesn't unmount it */}
            {pendingReviewOrder && (
                <ReviewPopup
                    order={pendingReviewOrder}
                    isOpen={true}
                    onClose={() => setPendingReviewOrder(null)}
                    onSubmit={(reviews) => {
                        console.log("Reviews submitted:", reviews);
                    }}
                />
            )}
        </>
    );
}
