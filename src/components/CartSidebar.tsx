"use client";

import { useCartStore } from "@/store/cart";
import { Store } from "@/types";
import { ShoppingBag, X, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { generateDemoOrder } from "@/lib/demoOrder";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    store: Store;
}

export default function CartSidebar({ isOpen, onClose, store }: CartSidebarProps) {
    const { data: session } = useSession();
    const {
        items,
        addItem,
        decrementItem,
        getTotalItems,
        getSubtotal,
        getDeliveryFee,
        getTotal,
        clearCart,
        pendingReviewOrder,
        setPendingReviewOrder,
    } = useCartStore();
    const totalItems = getTotalItems();
    const subtotal = getSubtotal();
    const delivery = getDeliveryFee(store.free_delivery_threshold, store.delivery_charges);
    const total = getTotal(store.free_delivery_threshold, store.delivery_charges);

    const handleCheckout = () => {
        if (!session) {
            signIn("google");
            onClose();
            return;
        }

        // Generate a demo order
        const orderItems = Object.values(items);
        const demoOrder = generateDemoOrder(store, orderItems, subtotal, delivery, total);

        // Clear the cart
        clearCart();
        
        // Close the cart sidebar
        onClose();

        // Show review popup after a short delay (simulating order completion)
        setTimeout(() => {
            setPendingReviewOrder(demoOrder);
        }, 2000);
    };

    const handleReviewSubmit = (reviews: any) => {
        // TODO: persist reviews to database
        // In a real app, send this to your backend
        // For now, just log it
    };

    const handleReviewClose = () => {
        setPendingReviewOrder(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="cart-overlay" onClick={onClose} />

            {/* Sidebar */}
            <div className="cart-sidebar">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gray-700" />
                        <h3 className="font-semibold text-gray-900">Your Cart</h3>
                        <span className="text-sm text-gray-500">({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {totalItems === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium">Your cart is empty</p>
                        </div>
                    ) : (
                        <div>
                            {Object.values(items).map(({ product, quantity }) => (
                                <div key={product.id} className="flex items-center gap-3 py-3 border-b border-gray-100">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.weight}</div>
                                        <div className="text-sm font-semibold mt-1">Rs. {(product.price * quantity).toLocaleString()}</div>
                                    </div>
                                    <div className="qty-control flex-shrink-0">
                                        <button className="qty-btn" onClick={() => decrementItem(product.id)}>−</button>
                                        <span className="qty-val">{quantity}</span>
                                        <button className="qty-btn" onClick={() => addItem(product)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-4">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery</span>
                            <span className="font-medium">
                                {delivery === 0 && totalItems > 0 ? "FREE" : `Rs. ${delivery.toLocaleString()}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span>Rs. {total.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-colors"
                        style={{ background: "#E5A528" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#C4881C")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "#E5A528")}
                        onClick={handleCheckout}
                    >
                        {session ? "Proceed to Checkout" : "Login to Checkout"}
                    </button>
                </div>
            </div>

        </>
    );
}

// Mobile Cart Bar - shown at bottom of store page
export function MobileCartBar({ store, onOpen }: { store: Store; onOpen: () => void }) {
    const totalItems = useCartStore((s) => s.getTotalItems());
    const getTotal = useCartStore((s) => s.getTotal);
    const total = getTotal(store.free_delivery_threshold, store.delivery_charges);

    if (totalItems === 0) return null;

    return (
        <div className="md:hidden" onClick={onOpen}>
            <div className="mobile-cart-bar">
                <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold">Rs. {total.toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
