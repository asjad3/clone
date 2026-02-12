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
