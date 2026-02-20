"use client";

import { useMemo, useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import {
    X,
    Star,
    Check,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Image from "next/image";

interface ReviewPopupProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reviews: {
        rider?: RiderReview;
        store?: StoreReview;
        products: ProductReview[];
    }) => void;
}

type ReviewStep = "rider" | "store" | "products" | "complete";

export default function ReviewPopup({ order, isOpen, onClose, onSubmit }: ReviewPopupProps) {
    const [currentStep, setCurrentStep] = useState<ReviewStep>("rider");
    const [riderRating, setRiderRating] = useState(0);
    const [riderComment, setRiderComment] = useState("");
    const [storeRating, setStoreRating] = useState(0);
    const [storeComment, setStoreComment] = useState("");
    const [productRatings, setProductRatings] = useState<Record<number, number>>({});
    const [productComments, setProductComments] = useState<Record<number, string>>({});
    const [currentProductIndex, setCurrentProductIndex] = useState(0);

    const stepFlow: Array<Exclude<ReviewStep, "complete">> = ["rider", "store", "products"];

    if (!isOpen) return null;

    const handleRiderNext = () => {
        if (riderRating === 0) return;
        if (riderRating <= 2 && !riderComment.trim()) return;
        setCurrentStep("store");
    };

    const handleStoreNext = () => {
        if (storeRating > 0 && storeRating <= 2 && !storeComment.trim()) return;
        setCurrentStep("products");
    };

    const hasMissingLowProductComment = order.items.some(({ product }) => {
        const rating = productRatings[product.id] || 0;
        return rating > 0 && rating <= 2 && !(productComments[product.id] || "").trim();
    });

    const currentStepIndex = currentStep === "complete" ? 3 : stepFlow.indexOf(currentStep);

    const ratedProductsCount = useMemo(
        () => order.items.filter(({ product }) => (productRatings[product.id] || 0) > 0).length,
        [order.items, productRatings],
    );
    const currentProductItem = order.items[currentProductIndex];

    const handleProductsSubmit = () => {
        const riderReview: RiderReview = {
            orderId: order.id,
            riderId: order.rider.id,
            rating: riderRating,
            comment: riderComment || undefined,
        };

        const storeReview: StoreReview = {
            orderId: order.id,
            storeId: order.store.id,
            rating: storeRating,
            comment: storeComment || undefined,
        };

        const productReviews: ProductReview[] = order.items.map((item) => ({
            orderId: order.id,
            productId: item.product.id,
            rating: productRatings[item.product.id] || 0,
            comment: productComments[item.product.id] || undefined,
        }));

        onSubmit({
            rider: riderReview,
            store: storeReview,
            products: productReviews,
        });

        setCurrentStep("complete");
    };

    const handleNextProduct = () => {
        setCurrentProductIndex((prev) => Math.min(prev + 1, order.items.length - 1));
    };

    const handlePrevProduct = () => {
        setCurrentProductIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleSkip = () => {
        onClose();
    };

    const handleCompleteClose = () => {
        onClose();
        setTimeout(() => {
            setCurrentStep("rider");
            setRiderRating(0);
            setRiderComment("");
            setStoreRating(0);
            setStoreComment("");
            setProductRatings({});
            setProductComments({});
            setCurrentProductIndex(0);
        }, 300);
    };

    const StarRating = ({
        rating,
        onRate,
        starSize = 28,
    }: {
        rating: number;
        onRate: (nextRating: number) => void;
        starSize?: number;
    }) => {
        const [hoveredStar, setHoveredStar] = useState<number | null>(null);

        return (
            <div className="rv-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className={`rv-star-btn ${star <= (hoveredStar ?? rating) ? "active" : ""}`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                        <Star
                            style={{ width: starSize, height: starSize }}
                            className="rv-star-icon"
                        />
                    </button>
                ))}
            </div>
        );
    };

    const stepLabels = ["Rider", "Store", "Items"];

    return (
        <>
            <div className="rv-overlay" onClick={handleSkip} />

            <div className="rv-wrap">
                <div className="rv-popup font-[family-name:var(--font-geist-sans)]">
                    {/* Close */}
                    <button
                        onClick={handleSkip}
                        className="rv-close"
                        aria-label="Close review popup"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Step Indicators */}
                    {currentStep !== "complete" && (
                        <div className="rv-steps">
                            {stepLabels.map((label, i) => (
                                <div
                                    key={label}
                                    className={`rv-step-dot ${i < currentStepIndex ? "done" : ""} ${i === currentStepIndex ? "current" : ""}`}
                                >
                                    <span className="rv-dot" />
                                    <span className="rv-step-label">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ───── RIDER STEP ───── */}
                    {currentStep === "rider" && (
                        <div className="rv-body review-step">
                            <h3 className="rv-title">How was delivery?</h3>
                            <p className="rv-subtitle">Rate your experience with {order.rider.name}</p>

                            <div className="rv-rider-card">
                                <div className="rv-rider-avatar">
                                    <Image src={order.rider.photo} alt={order.rider.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="rv-rider-name">{order.rider.name}</p>
                                    <p className="rv-rider-meta">{order.rider.vehicle}</p>
                                </div>
                            </div>

                            <div className="rv-rating-area">
                                <StarRating rating={riderRating} onRate={setRiderRating} starSize={32} />
                                <p className="rv-rating-hint">
                                    {riderRating === 0
                                        ? "Tap a star"
                                        : riderRating <= 2
                                            ? "Tell us what went wrong"
                                            : riderRating <= 4
                                                ? "Thanks for rating"
                                                : "Excellent!"}
                                </p>
                            </div>

                            {riderRating > 0 && (
                                <div className="rv-comment-area animate-slideDown">
                                    <textarea
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder={riderRating <= 2 ? "What happened?" : "Any feedback? (optional)"}
                                        className="rv-textarea"
                                        rows={riderRating <= 2 ? 3 : 2}
                                    />
                                    {riderRating <= 2 && !riderComment.trim() && (
                                        <p className="rv-required-hint">Required for low ratings</p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleRiderNext}
                                disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim())}
                                className="rv-btn-primary"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* ───── STORE STEP ───── */}
                    {currentStep === "store" && (
                        <div className="rv-body review-step">
                            <h3 className="rv-title">How was the store?</h3>
                            <p className="rv-subtitle">
                                Rate {order.store.name} <span className="rv-optional-tag">optional</span>
                            </p>

                            <div className="rv-rating-area">
                                <StarRating rating={storeRating} onRate={setStoreRating} starSize={32} />
                                <p className="rv-rating-hint">
                                    {storeRating === 0
                                        ? "Skip or rate"
                                        : storeRating <= 2
                                            ? "Please explain briefly"
                                            : "Thanks!"}
                                </p>
                            </div>

                            {storeRating > 0 && (
                                <div className="rv-comment-area animate-slideDown">
                                    <textarea
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder={
                                            storeRating <= 2
                                                ? "What was the issue?"
                                                : "Anything to share? (optional)"
                                        }
                                        className="rv-textarea"
                                        rows={2}
                                    />
                                    {storeRating > 0 && storeRating <= 2 && !storeComment.trim() && (
                                        <p className="rv-required-hint">Required for low ratings</p>
                                    )}
                                </div>
                            )}

                            <div className="rv-actions-row">
                                <button
                                    onClick={() => setCurrentStep("products")}
                                    className="rv-btn-ghost"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleStoreNext}
                                    disabled={storeRating > 0 && storeRating <= 2 && !storeComment.trim()}
                                    className="rv-btn-primary"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ───── PRODUCTS STEP ───── */}
                    {currentStep === "products" && (
                        <div className="rv-body review-step">
                            <h3 className="rv-title">Rate your items</h3>
                            <p className="rv-subtitle">
                                {ratedProductsCount}/{order.items.length} rated <span className="rv-optional-tag">optional</span>
                            </p>

                            {currentProductItem && (
                                <div className="rv-product-card">
                                    <div className="rv-product-header">
                                        <Image
                                            src={currentProductItem.product.image}
                                            alt={currentProductItem.product.name}
                                            width={48}
                                            height={48}
                                            className="rv-product-img"
                                        />
                                        <div className="rv-product-info">
                                            <h4 className="rv-product-name">
                                                {currentProductItem.product.name}
                                            </h4>
                                            <p className="rv-product-qty">Qty: {currentProductItem.quantity}</p>
                                        </div>

                                        {order.items.length > 1 && (
                                            <div className="rv-product-nav">
                                                <button
                                                    onClick={handlePrevProduct}
                                                    disabled={currentProductIndex === 0}
                                                    className="rv-nav-btn"
                                                    aria-label="Previous product"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <span className="rv-product-counter">
                                                    {currentProductIndex + 1}/{order.items.length}
                                                </span>
                                                <button
                                                    onClick={handleNextProduct}
                                                    disabled={currentProductIndex === order.items.length - 1}
                                                    className="rv-nav-btn"
                                                    aria-label="Next product"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rv-product-rating">
                                        <StarRating
                                            rating={productRatings[currentProductItem.product.id] || 0}
                                            onRate={(rating) =>
                                                setProductRatings((prev) => ({ ...prev, [currentProductItem.product.id]: rating }))
                                            }
                                            starSize={24}
                                        />
                                    </div>

                                    {productRatings[currentProductItem.product.id] > 0 &&
                                        productRatings[currentProductItem.product.id] <= 2 && (
                                            <textarea
                                                value={productComments[currentProductItem.product.id] || ""}
                                                onChange={(e) =>
                                                    setProductComments((prev) => ({
                                                        ...prev,
                                                        [currentProductItem.product.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder="What was wrong? (required)"
                                                className="rv-textarea rv-textarea-sm"
                                                rows={2}
                                            />
                                        )}

                                    {/* Product page dots */}
                                    {order.items.length > 1 && (
                                        <div className="rv-page-dots">
                                            {order.items.map((item, index) => (
                                                <button
                                                    key={item.product.id}
                                                    onClick={() => setCurrentProductIndex(index)}
                                                    className={`rv-page-dot ${currentProductIndex === index ? "active" : ""} ${(productRatings[item.product.id] || 0) > 0 ? "rated" : ""}`}
                                                    aria-label={`Go to product ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rv-actions-row">
                                <button
                                    onClick={handleProductsSubmit}
                                    className="rv-btn-ghost"
                                >
                                    Skip & finish
                                </button>
                                <button
                                    onClick={handleProductsSubmit}
                                    disabled={hasMissingLowProductComment}
                                    className="rv-btn-primary"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ───── COMPLETE ───── */}
                    {currentStep === "complete" && (
                        <div className="rv-body rv-complete review-step">
                            <div className="rv-check-circle animate-scale-in">
                                <Check className="h-7 w-7" />
                            </div>
                            <h3 className="rv-title">Thank you</h3>
                            <p className="rv-subtitle rv-complete-sub">
                                Your feedback helps us improve the experience for everyone.
                            </p>

                            <button
                                onClick={handleCompleteClose}
                                className="rv-btn-primary"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Maybe later */}
                    {currentStep !== "complete" && (
                        <button
                            onClick={handleSkip}
                            className="rv-skip-link"
                        >
                            Maybe later
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
