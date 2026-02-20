"use client";

import { useMemo, useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import {
    X,
    Star,
    Check,
    ThumbsUp,
    ThumbsDown,
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

const RIDER_TAGS_POSITIVE = ["On time", "Friendly", "Careful handling"];
const RIDER_TAGS_NEGATIVE = ["Late", "Rude", "Damaged items", "Wrong order"];
const STORE_TAGS_POSITIVE = ["Great quality", "Well packed", "Fast"];
const STORE_TAGS_NEGATIVE = ["Missing items", "Bad quality", "Slow prep"];

export default function ReviewPopup({ order, isOpen, onClose, onSubmit }: ReviewPopupProps) {
    const [currentStep, setCurrentStep] = useState<ReviewStep>("rider");
    const [riderRating, setRiderRating] = useState(0);
    const [riderComment, setRiderComment] = useState("");
    const [storeRating, setStoreRating] = useState(0);
    const [storeComment, setStoreComment] = useState("");
    const [productRatings, setProductRatings] = useState<Record<number, number>>({});
    const [productComments, setProductComments] = useState<Record<number, string>>({});
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [selectedRiderTags, setSelectedRiderTags] = useState<string[]>([]);
    const [selectedStoreTags, setSelectedStoreTags] = useState<string[]>([]);

    const stepFlow: Array<Exclude<ReviewStep, "complete">> = ["rider", "store", "products"];

    if (!isOpen) return null;

    const handleRiderNext = () => {
        if (riderRating === 0) return;
        if (riderRating <= 2 && !riderComment.trim() && selectedRiderTags.length === 0) return;
        setCurrentStep("store");
    };

    const handleStoreNext = () => {
        if (storeRating > 0 && storeRating <= 2 && !storeComment.trim() && selectedStoreTags.length === 0) return;
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
            comment: [
                ...selectedRiderTags,
                riderComment,
            ].filter(Boolean).join(". ") || undefined,
        };

        const storeReview: StoreReview = {
            orderId: order.id,
            storeId: order.store.id,
            rating: storeRating,
            comment: [
                ...selectedStoreTags,
                storeComment,
            ].filter(Boolean).join(". ") || undefined,
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
            setSelectedRiderTags([]);
            setSelectedStoreTags([]);
        }, 300);
    };

    const toggleTag = (tag: string, selected: string[], setSelected: (tags: string[]) => void) => {
        setSelected(
            selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag],
        );
    };

    const handleThumbRider = (isUp: boolean) => {
        setRiderRating(isUp ? 5 : 1);
    };

    const handleThumbStore = (isUp: boolean) => {
        setStoreRating(isUp ? 5 : 1);
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

    return (
        <>
            <div className="rv-overlay" onClick={handleSkip} />

            <div className="rv-wrap">
                <div className="rv-sheet font-[family-name:var(--font-geist-sans)]">
                    {/* Drag handle */}
                    <div className="rv-handle-bar">
                        <div className="rv-handle" />
                    </div>

                    {/* Close */}
                    <button
                        onClick={handleSkip}
                        className="rv-close"
                        aria-label="Close review popup"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Progress dots */}
                    {currentStep !== "complete" && (
                        <div className="rv-progress-dots">
                            {stepFlow.map((_, i) => (
                                <span
                                    key={i}
                                    className={`rv-pdot ${i <= currentStepIndex ? "filled" : ""}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* ───── RIDER STEP ───── */}
                    {currentStep === "rider" && (
                        <div className="rv-content review-step">
                            {/* Large centered avatar */}
                            <div className="rv-hero-avatar">
                                <Image src={order.rider.photo} alt={order.rider.name} fill className="object-cover" />
                            </div>

                            <h2 className="rv-heading">How was your delivery?</h2>
                            <p className="rv-subtext">{order.rider.name} · {order.rider.vehicle}</p>

                            {/* Thumbs quick rate */}
                            <div className="rv-thumbs">
                                <button
                                    type="button"
                                    onClick={() => handleThumbRider(false)}
                                    className={`rv-thumb-btn ${riderRating > 0 && riderRating <= 2 ? "selected negative" : ""}`}
                                >
                                    <ThumbsDown className="rv-thumb-icon" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleThumbRider(true)}
                                    className={`rv-thumb-btn ${riderRating >= 4 ? "selected positive" : ""}`}
                                >
                                    <ThumbsUp className="rv-thumb-icon" />
                                </button>
                            </div>

                            {/* Stars for fine-tuning */}
                            {riderRating > 0 && (
                                <div className="rv-fine-tune animate-slideDown">
                                    <StarRating rating={riderRating} onRate={setRiderRating} starSize={26} />
                                </div>
                            )}

                            {/* Tags */}
                            {riderRating > 0 && (
                                <div className="rv-tags animate-slideDown">
                                    {(riderRating <= 2 ? RIDER_TAGS_NEGATIVE : RIDER_TAGS_POSITIVE).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag, selectedRiderTags, setSelectedRiderTags)}
                                            className={`rv-tag ${selectedRiderTags.includes(tag) ? "selected" : ""}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Comment */}
                            {riderRating > 0 && (
                                <div className="rv-comment-area animate-slideDown">
                                    <textarea
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder={riderRating <= 2 ? "Tell us more..." : "Add a comment (optional)"}
                                        className="rv-textarea"
                                        rows={2}
                                    />
                                    {riderRating <= 2 && !riderComment.trim() && selectedRiderTags.length === 0 && (
                                        <p className="rv-hint-required">Please share what went wrong</p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleRiderNext}
                                disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim() && selectedRiderTags.length === 0)}
                                className="rv-btn-primary"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {/* ───── STORE STEP ───── */}
                    {currentStep === "store" && (
                        <div className="rv-content review-step">
                            <div className="rv-store-icon-wrap">
                                <span className="rv-store-emoji">🏪</span>
                            </div>

                            <h2 className="rv-heading">How was {order.store.name}?</h2>
                            <p className="rv-subtext">This step is optional</p>

                            {/* Thumbs quick rate */}
                            <div className="rv-thumbs">
                                <button
                                    type="button"
                                    onClick={() => handleThumbStore(false)}
                                    className={`rv-thumb-btn ${storeRating > 0 && storeRating <= 2 ? "selected negative" : ""}`}
                                >
                                    <ThumbsDown className="rv-thumb-icon" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleThumbStore(true)}
                                    className={`rv-thumb-btn ${storeRating >= 4 ? "selected positive" : ""}`}
                                >
                                    <ThumbsUp className="rv-thumb-icon" />
                                </button>
                            </div>

                            {/* Stars */}
                            {storeRating > 0 && (
                                <div className="rv-fine-tune animate-slideDown">
                                    <StarRating rating={storeRating} onRate={setStoreRating} starSize={26} />
                                </div>
                            )}

                            {/* Tags */}
                            {storeRating > 0 && (
                                <div className="rv-tags animate-slideDown">
                                    {(storeRating <= 2 ? STORE_TAGS_NEGATIVE : STORE_TAGS_POSITIVE).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag, selectedStoreTags, setSelectedStoreTags)}
                                            className={`rv-tag ${selectedStoreTags.includes(tag) ? "selected" : ""}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Comment */}
                            {storeRating > 0 && (
                                <div className="rv-comment-area animate-slideDown">
                                    <textarea
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder={
                                            storeRating <= 2
                                                ? "What went wrong?"
                                                : "Add a comment (optional)"
                                        }
                                        className="rv-textarea"
                                        rows={2}
                                    />
                                    {storeRating > 0 && storeRating <= 2 && !storeComment.trim() && selectedStoreTags.length === 0 && (
                                        <p className="rv-hint-required">Please share what went wrong</p>
                                    )}
                                </div>
                            )}

                            <div className="rv-actions-split">
                                <button
                                    onClick={() => setCurrentStep("products")}
                                    className="rv-btn-secondary"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleStoreNext}
                                    disabled={storeRating > 0 && storeRating <= 2 && !storeComment.trim() && selectedStoreTags.length === 0}
                                    className="rv-btn-primary"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ───── PRODUCTS STEP ───── */}
                    {currentStep === "products" && (
                        <div className="rv-content review-step">
                            <h2 className="rv-heading">Rate your items</h2>
                            <p className="rv-subtext">
                                {ratedProductsCount} of {order.items.length} rated · optional
                            </p>

                            {currentProductItem && (
                                <div className="rv-item-card">
                                    <div className="rv-item-row">
                                        <div className="rv-item-img-wrap">
                                            <Image
                                                src={currentProductItem.product.image}
                                                alt={currentProductItem.product.name}
                                                width={56}
                                                height={56}
                                                className="rv-item-img"
                                            />
                                        </div>
                                        <div className="rv-item-info">
                                            <p className="rv-item-name">{currentProductItem.product.name}</p>
                                            <p className="rv-item-qty">×{currentProductItem.quantity}</p>
                                        </div>
                                    </div>

                                    <StarRating
                                        rating={productRatings[currentProductItem.product.id] || 0}
                                        onRate={(rating) =>
                                            setProductRatings((prev) => ({ ...prev, [currentProductItem.product.id]: rating }))
                                        }
                                        starSize={28}
                                    />

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
                                                placeholder="What was wrong?"
                                                className="rv-textarea"
                                                rows={2}
                                            />
                                        )}
                                </div>
                            )}

                            {/* Product nav */}
                            {order.items.length > 1 && (
                                <div className="rv-item-nav">
                                    <button
                                        onClick={handlePrevProduct}
                                        disabled={currentProductIndex === 0}
                                        className="rv-item-nav-btn"
                                        aria-label="Previous product"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <div className="rv-item-dots">
                                        {order.items.map((item, index) => (
                                            <button
                                                key={item.product.id}
                                                onClick={() => setCurrentProductIndex(index)}
                                                className={`rv-item-dot ${currentProductIndex === index ? "active" : ""} ${(productRatings[item.product.id] || 0) > 0 ? "rated" : ""}`}
                                                aria-label={`Go to product ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleNextProduct}
                                        disabled={currentProductIndex === order.items.length - 1}
                                        className="rv-item-nav-btn"
                                        aria-label="Next product"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}

                            <div className="rv-actions-split">
                                <button
                                    onClick={handleProductsSubmit}
                                    className="rv-btn-secondary"
                                >
                                    Skip
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
                        <div className="rv-content rv-done review-step">
                            <div className="rv-done-check animate-scale-in">
                                <Check className="h-8 w-8" />
                            </div>
                            <h2 className="rv-heading">Thanks for your feedback!</h2>
                            <p className="rv-subtext rv-done-sub">
                                Your ratings help us improve the experience.
                            </p>
                            <button onClick={handleCompleteClose} className="rv-btn-primary">
                                Done
                            </button>
                        </div>
                    )}

                    {/* Skip link */}
                    {currentStep !== "complete" && (
                        <button onClick={handleSkip} className="rv-dismiss">
                            Not now
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
