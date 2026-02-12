"use client";

import { useState, useCallback, useEffect, useRef, useTransition, useOptimistic } from "react";
import { Loader2 } from "lucide-react";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

interface ProductGridProps {
    initialProducts: Product[];
    storeSlug: string;
    searchQuery?: string;
}

interface ProductState {
    products: Product[];
    hasMore: boolean;
    cursor: number | null;
}

export default function ProductGrid({ initialProducts, storeSlug, searchQuery }: ProductGridProps) {
    const [state, setState] = useState<ProductState>({
        products: initialProducts,
        hasMore: true,
        cursor: initialProducts.length,
    });
    const [isPending, startTransition] = useTransition();
    // useOptimistic for instant UI feedback when adding products to view
    const [optimisticProducts, addOptimisticProducts] = useOptimistic(
        state.products,
        (currentProducts: Product[], newProducts: Product[]) => [...currentProducts, ...newProducts]
    );
    const loaderRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const loadMore = useCallback(() => {
        if (loadingRef.current || !state.hasMore || !state.cursor) return;
        loadingRef.current = true;

        startTransition(async () => {
            try {
                const params = new URLSearchParams({
                    store: storeSlug,
                    limit: "8",
                    cursor: String(state.cursor),
                });
                if (searchQuery) params.set("search", searchQuery);

                const res = await fetch(`/api/products?${params}`);
                const data = await res.json();

                // Optimistic UI update — show products in view immediately
                addOptimisticProducts(data.products);

                setState((prev) => ({
                    products: [...prev.products, ...data.products],
                    hasMore: data.hasMore,
                    cursor: data.nextCursor,
                }));
            } finally {
                loadingRef.current = false;
            }
        });
    }, [state.hasMore, state.cursor, storeSlug, searchQuery, addOptimisticProducts, startTransition]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        if (!state.hasMore || isPending) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingRef.current) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        const el = loaderRef.current;
        if (el) observer.observe(el);
        return () => { if (el) observer.unobserve(el); };
    }, [state.hasMore, state.cursor, isPending, loadMore]);

    // Reset when search query changes
    useEffect(() => {
        loadingRef.current = true;
        startTransition(async () => {
            try {
                const params = new URLSearchParams({
                    store: storeSlug,
                    limit: "8",
                    cursor: "0",
                });
                if (searchQuery) params.set("search", searchQuery);

                const res = await fetch(`/api/products?${params}`);
                const data = await res.json();

                setState({
                    products: data.products,
                    hasMore: data.hasMore,
                    cursor: data.nextCursor,
                });
            } finally {
                loadingRef.current = false;
            }
        });
    }, [searchQuery, storeSlug, startTransition]);

    return (
        <div className="max-w-6xl mx-auto px-4 pb-8">
            {/* Product count */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                    {optimisticProducts.length} Products
                    {searchQuery && <span className="ml-1">for &quot;{searchQuery}&quot;</span>}
                </p>
                {isPending && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                    </div>
                )}
            </div>

            {/* Grid */}
            {optimisticProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {optimisticProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                !isPending && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.3-4.3" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No products found</p>
                        <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                    </div>
                )
            )}

            {/* Infinite scroll trigger & skeleton */}
            {state.hasMore && (
                <div ref={loaderRef} className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="product-card">
                                <div className="img-wrap">
                                    <div className="skeleton absolute inset-3" />
                                </div>
                                <div className="info">
                                    <div className="skeleton h-3 w-16 mb-2" />
                                    <div className="skeleton h-4 w-full mb-1" />
                                    <div className="skeleton h-3 w-12 mb-2" />
                                    <div className="skeleton h-8 w-full mt-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
