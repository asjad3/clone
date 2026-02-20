"use client";

import { useState } from "react";
import ReviewPopup from "@/components/ReviewPopup";
import { Order } from "@/types";

// Demo order for testing
const demoOrder: Order = {
    id: "order_123456",
    orderNumber: "LM00123456",
    date: new Date().toISOString(),
    items: [
        {
            product: {
                id: 1,
                name: "Fresh Milk 1L",
                weight: "1 Liter",
                price: 280,
                oldPrice: null,
                category_id: 1,
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
                in_stock: true,
                store_slug: "demo-store",
            },
            quantity: 2,
        },
        {
            product: {
                id: 2,
                name: "Whole Wheat Bread",
                weight: "400g",
                price: 120,
                oldPrice: 150,
                category_id: 2,
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
                in_stock: true,
                store_slug: "demo-store",
            },
            quantity: 1,
        },
    ],
    subtotal: 680,
    delivery: 0,
    total: 680,
    store: {
        id: 1,
        name: "FreshMart Grocery",
        slug: "freshmart-grocery",
        store_type: "grocery",
        same_day_delivery: true,
        delivery_charges: 100,
        min_order_value: 500,
        free_delivery_threshold: 1500,
        areas: [1, 2, 3],
        store_hours: "8:00 AM - 10:00 PM",
        delivery_hours: "8:00 AM - 9:00 PM",
    },
    rider: {
        id: 1,
        name: "Ahmed Khan",
        photo: "https://i.pravatar.cc/150?img=12",
        phone: "+92 300 1234567",
        vehicle: "Motorcycle",
    },
    deliveredAt: new Date().toISOString(),
};

export default function ReviewDemo() {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (reviews: any) => {
        console.log("Reviews submitted:", reviews);
        alert("Reviews submitted! Check console for details.");
    };

    return (
        <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-6">
            <div className="max-w-sm w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                    Review System
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                    Post-delivery feedback flow
                </p>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    Open Review
                </button>

                <p className="mt-3 text-xs text-gray-400">
                    Appears after order delivery
                </p>
            </div>

            <ReviewPopup
                order={demoOrder}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
