// ==================== TYPES ====================

export interface Area {
    id: number;
    name: string;
    city: string;
}

export interface Store {
    id: number;
    name: string;
    slug: string;
    store_type: string;
    same_day_delivery: boolean;
    delivery_charges: number;
    min_order_value: number;
    free_delivery_threshold: number;
    areas: number[];
    store_hours: string;
    delivery_hours: string;
}

export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
}

export interface Product {
    id: number;
    name: string;
    weight: string;
    price: number;
    oldPrice: number | null;
    category_id: number;
    image: string;
    in_stock: boolean;
    store_slug: string;
}

export interface CartItem {
    productId: number;
    quantity: number;
}

export interface PaginatedProducts {
    products: Product[];
    nextCursor: number | null;
    hasMore: boolean;
    total: number;
}

// ==================== RIDER ====================

export interface Rider {
    id: number;
    name: string;
    photo: string;
    phone: string;
    vehicle: string;
}

// ==================== ORDER ====================

export interface Order {
    id: string;
    orderNumber: string;
    date: string;
    items: {
        product: Product;
        quantity: number;
    }[];
    subtotal: number;
    delivery: number;
    total: number;
    store: Store;
    rider: Rider;
    deliveredAt?: string;
}

// ==================== REVIEWS ====================

export interface RiderReview {
    orderId: string;
    riderId: number;
    rating: number;
    comment?: string;
}

export interface StoreReview {
    orderId: string;
    storeId: number;
    rating: number;
    comment?: string;
}

export interface ProductReview {
    orderId: string;
    productId: number;
    rating: number;
    comment?: string;
}

export interface OrderReviews {
    rider?: RiderReview;
    store?: StoreReview;
    products: ProductReview[];
}
