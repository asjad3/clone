"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface FeaturedCarouselProps {
    products: Product[];
}

export default function FeaturedCarousel({ products }: FeaturedCarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: number) => {
        if (trackRef.current) {
            trackRef.current.scrollBy({ left: direction * 220, behavior: "smooth" });
        }
    };

    return (
        <div className="carousel-wrap">
            <button
                className="carousel-arrow"
                style={{ left: 4 }}
                onClick={() => scroll(-1)}
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="carousel-track scrollbar-hide" ref={trackRef}>
                {products.map((product) => (
                    <div key={product.id} className="carousel-card">
                        <ProductCard product={product} showWeight={false} />
                    </div>
                ))}
            </div>

            <button
                className="carousel-arrow"
                style={{ right: 4 }}
                onClick={() => scroll(1)}
                aria-label="Scroll right"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
