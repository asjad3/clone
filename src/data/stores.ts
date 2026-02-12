import { Store } from "@/types";

export const stores: Store[] = [
    {
        id: 24,
        name: "Hash Mart",
        slug: "hash-mart",
        store_type: "mart",
        same_day_delivery: true,
        delivery_charges: 200,
        min_order_value: 100,
        free_delivery_threshold: 500,
        areas: [5],
        store_hours: "All day",
        delivery_hours: "All day",
    },
    {
        id: 22,
        name: "Royal Cash & Carry",
        slug: "royal-cash-and-carry",
        store_type: "mart",
        same_day_delivery: true,
        delivery_charges: 100,
        min_order_value: 100,
        free_delivery_threshold: 1000,
        areas: [2, 4],
        store_hours: "8:00 AM - 11:59 PM",
        delivery_hours: "4:00 PM - 11:00 PM",
    },
];
