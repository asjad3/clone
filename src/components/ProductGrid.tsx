"use client";

import { useState, useCallback, useEffect, useRef, useTransition, useOptimistic } from "react";
import { Loader2, SearchX } from "lucide-react";
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

type ViewMode = "grid" | "list";

export default function ProductGrid({ initialProducts, storeSlug, searchQuery }: ProductGridProps) {
    const [state, setState] = useState<ProductState>({
        products: initialProducts,
        hasMore: true,
        cursor: initialProducts.length,
    });
    const [inStockOnly, setInStockOnly] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [isPending, startTransition] = useTransition();
    // useOptimistic for instant UI feedback when adding products to view
    const [optimisticProducts, addOptimisticProducts] = useOptimistic(
        state.products,
        (currentProducts: Product[], newProducts: Product[]) => [...currentProducts, ...newProducts]
    );
    const loaderRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const fetchProducts = useCallback(
        async (cursorValue: number) => {
            const params = new URLSearchParams({
                storeSlug,
                limit: "8",
                cursor: String(cursorValue),
                inStockOnly: String(inStockOnly),
            });

            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) {
                throw new Error("Failed to load products");
            }

            return res.json() as Promise<{
                products: Product[];
                hasMore: boolean;
                nextCursor: number | null;
            }>;
        },
        [storeSlug, inStockOnly, searchQuery]
    );

    const loadMore = useCallback(() => {
        if (loadingRef.current || !state.hasMore || state.cursor === null) return;
        loadingRef.current = true;
        const currentCursor = state.cursor;

        startTransition(async () => {
            try {
                const data = await fetchProducts(currentCursor);

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
    }, [state.hasMore, state.cursor, fetchProducts, addOptimisticProducts, startTransition]);

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
    }, [state.hasMore, isPending, loadMore]);

    // Reset when query/filters/store change
    useEffect(() => {
        loadingRef.current = true;
        startTransition(async () => {
            try {
                const data = await fetchProducts(0);

                setState({
                    products: data.products,
                    hasMore: data.hasMore,
                    cursor: data.nextCursor,
                });
            } finally {
                loadingRef.current = false;
            }
        });
    }, [searchQuery, storeSlug, inStockOnly, fetchProducts, startTransition]);

    return (
        <div className="max-w-6xl mx-auto px-4 pb-8">
            {/* Product header controls */}
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">Popular Products</h2>
                        <div className="flex gap-1">
                            <button
                                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </button>
                            <button
                                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <circle cx="4" cy="6" r="1" />
                                    <circle cx="4" cy="12" r="1" />
                                    <circle cx="4" cy="18" r="1" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <span>In stock only</span>
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="rounded"
                        />
                    </label>
                </div>

            </div>

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
                <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" : "product-list"}>
                    {optimisticProducts.map((product, index) => (
                        <ProductCard key={`${product.id}-${index}`} product={product} />
                    ))}
                </div>
            ) : (
                !isPending && (
                    <div className="text-center py-16">
                        <SearchX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No products found</p>
                    </div>
                )
            )}

            {/* Infinite scroll trigger & skeleton */}
            {state.hasMore && (
                <div ref={loaderRef} className="mt-6">
                    <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" : "product-list"}>
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

                    <div className="text-center mt-4">
                        <button
                            className="toolbar-chip"
                            onClick={loadMore}
                            disabled={isPending}
                        >
                            {isPending ? "Loading..." : "Load more"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
