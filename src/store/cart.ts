"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/types";

interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: Record<number, CartItem>;
    // Actions
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    decrementItem: (productId: number) => void;
    clearCart: () => void;
    // Computed
    getTotalItems: () => number;
    getSubtotal: () => number;
    getDeliveryFee: (freeThreshold: number, deliveryCharge: number) => number;
    getTotal: (freeThreshold: number, deliveryCharge: number) => number;
    getItemQuantity: (productId: number) => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: {},

            addItem: (product: Product) =>
                set((state) => {
                    const existing = state.items[product.id];
                    return {
                        items: {
                            ...state.items,
                            [product.id]: {
                                product,
                                quantity: existing ? existing.quantity + 1 : 1,
                            },
                        },
                    };
                }),

            removeItem: (productId: number) =>
                set((state) => {
                    const newItems = { ...state.items };
                    delete newItems[productId];
                    return { items: newItems };
                }),

            decrementItem: (productId: number) =>
                set((state) => {
                    const existing = state.items[productId];
                    if (!existing) return state;
                    if (existing.quantity <= 1) {
                        const newItems = { ...state.items };
                        delete newItems[productId];
                        return { items: newItems };
                    }
                    return {
                        items: {
                            ...state.items,
                            [productId]: {
                                ...existing,
                                quantity: existing.quantity - 1,
                            },
                        },
                    };
                }),

            clearCart: () => set({ items: {} }),

            getTotalItems: () => {
                return Object.values(get().items).reduce(
                    (total, item) => total + item.quantity,
                    0
                );
            },

            getSubtotal: () => {
                return Object.values(get().items).reduce(
                    (total, item) => total + item.product.price * item.quantity,
                    0
                );
            },

            getDeliveryFee: (freeThreshold: number, deliveryCharge: number) => {
                const totalItems = get().getTotalItems();
                if (totalItems === 0) return 0;
                const subtotal = get().getSubtotal();
                return subtotal >= freeThreshold ? 0 : deliveryCharge;
            },

            getTotal: (freeThreshold: number, deliveryCharge: number) => {
                return get().getSubtotal() + get().getDeliveryFee(freeThreshold, deliveryCharge);
            },

            getItemQuantity: (productId: number) => {
                return get().items[productId]?.quantity || 0;
            },
        }),
        {
            name: "lootmart-cart",
            storage: createJSONStorage(() => localStorage),
            // Only persist the items, not the functions
            partialize: (state) => ({ items: state.items }),
        }
    )
);
