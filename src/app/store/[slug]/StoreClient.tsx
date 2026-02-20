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
                    product: { id: 101, name: "Fresh Milk 1L", weight: "1 Liter", price: 280, oldPrice: null, category_id: 1, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 2,
                },
                {
                    product: { id: 102, name: "Whole Wheat Bread", weight: "400g", price: 120, oldPrice: 150, category_id: 2, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 103, name: "Free-Range Eggs", weight: "12 pack", price: 350, oldPrice: null, category_id: 1, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 104, name: "Basmati Rice", weight: "5 kg", price: 890, oldPrice: 950, category_id: 3, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 105, name: "Olive Oil Extra Virgin", weight: "500ml", price: 1200, oldPrice: null, category_id: 3, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 106, name: "Chicken Breast", weight: "1 kg", price: 680, oldPrice: null, category_id: 4, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 2,
                },
                {
                    product: { id: 107, name: "Greek Yogurt", weight: "500g", price: 220, oldPrice: 260, category_id: 1, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 3,
                },
                {
                    product: { id: 108, name: "Cheddar Cheese", weight: "200g", price: 450, oldPrice: null, category_id: 1, image: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 109, name: "Fresh Orange Juice", weight: "1 Liter", price: 320, oldPrice: null, category_id: 5, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 2,
                },
                {
                    product: { id: 110, name: "Bananas", weight: "1 dozen", price: 150, oldPrice: null, category_id: 6, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 111, name: "Tomatoes", weight: "1 kg", price: 120, oldPrice: null, category_id: 6, image: "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 112, name: "Pasta Penne", weight: "500g", price: 280, oldPrice: 320, category_id: 3, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 2,
                },
                {
                    product: { id: 113, name: "Mineral Water", weight: "1.5L × 6", price: 390, oldPrice: null, category_id: 5, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 1,
                },
                {
                    product: { id: 114, name: "Dark Chocolate Bar", weight: "100g", price: 350, oldPrice: null, category_id: 7, image: "https://images.unsplash.com/photo-1549007994-cb92caefdbed?w=400", in_stock: true, store_slug: store.slug },
                    quantity: 2,
                },
                {
                    product: { id: 115, name: "Ground Coffee", weight: "250g", price: 750, oldPrice: 850, category_id: 5, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400", in_stock: true, store_slug: store.slug },
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
