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
        // TODO: persist reviews to database
        alert("Reviews submitted! Check console for details.");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Review System Demo
                    </h1>
                    <p className="text-gray-600">
                        Progressive review popup for orders
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Step 1: Rate delivery rider (priority)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Step 2: Rate the store</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Step 3: Rate products</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Low ratings require comments</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Progress bar for visual feedback</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>Skip option for non-intrusive UX</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-colors shadow-lg shadow-yellow-400/30"
                >
                    Open Review Popup
                </button>

                <p className="mt-4 text-xs text-gray-500">
                    This popup appears after order delivery
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
