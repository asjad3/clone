import { Order, Rider, Store, Product } from "@/types";

// Demo rider data
const demoRiders: Rider[] = [
    {
        id: 1,
        name: "Ahmed Khan",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        phone: "+92 300 1234567",
        vehicle: "Motorcycle",
    },
    {
        id: 2,
        name: "Hassan Ali",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
        phone: "+92 301 9876543",
        vehicle: "Motorcycle",
    },
    {
        id: 3,
        name: "Bilal Raza",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        phone: "+92 345 5551234",
        vehicle: "Bike",
    },
];

export function generateDemoOrder(
    store: Store,
    items: { product: Product; quantity: number }[],
    subtotal: number,
    delivery: number,
    total: number
): Order {
    const randomRider = demoRiders[Math.floor(Math.random() * demoRiders.length)];
    const orderNumber = `LM${Date.now().toString().slice(-8)}`;
    const now = new Date();
    const deliveredAt = new Date(now.getTime() + 45 * 60000); // 45 minutes from now

    return {
        id: `order_${Date.now()}`,
        orderNumber,
        date: now.toISOString(),
        items,
        subtotal,
        delivery,
        total,
        store,
        rider: randomRider,
        deliveredAt: deliveredAt.toISOString(),
    };
}
