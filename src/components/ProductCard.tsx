"use client";

import Image from "next/image";
import { Product } from "@/types";
import { getCatName, getCatColorForProduct } from "@/data/categories";
import { useCartStore } from "@/store/cart";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
    product: Product;
    showWeight?: boolean;
}

export default function ProductCard({ product, showWeight = true }: ProductCardProps) {
    const { addItem, decrementItem, getItemQuantity } = useCartStore();
    const qty = getItemQuantity(product.id);
    const color = getCatColorForProduct(product.category_id);
    const discount = product.oldPrice
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    return (
        <div className="product-card" id={`product-${product.id}`}>
            <div className="img-wrap">
                {discount > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            -{discount}%
                        </span>
                    </div>
                )}
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-contain p-3"
                    loading="lazy"
                />
            </div>
            <div className="info">
                <span
                    className="cat-label"
                    style={{
                        background: `${color}15`,
                        color: color,
                    }}
                >
                    {getCatName(product.category_id)}
                </span>
                <div className="pname">{product.name}</div>
                {showWeight && <div className="pweight">{product.weight}</div>}
                <div className="price-row">
                    <div>
                        <span className="price">Rs. {product.price.toLocaleString()}</span>
                        {product.oldPrice && (
                            <span className="old-price">Rs. {product.oldPrice.toLocaleString()}</span>
                        )}
                    </div>
                </div>
                {qty === 0 ? (
                    <button className="add-btn mt-2" onClick={() => addItem(product)}>
                        <ShoppingCart className="w-4 h-4" />
                        Add
                    </button>
                ) : (
                    <div className="qty-control mt-2" style={{ width: "100%", justifyContent: "center" }}>
                        <button className="qty-btn" onClick={() => decrementItem(product.id)}>−</button>
                        <span className="qty-val">{qty}</span>
                        <button className="qty-btn" onClick={() => addItem(product)}>+</button>
                    </div>
                )}
            </div>
        </div>
    );
}
