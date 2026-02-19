"use client";

import { useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import { X, Star, CheckCircle, Package, Store as StoreIcon, Sparkles } from "lucide-react";
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

    if (!isOpen) return null;

    const handleRiderNext = () => {
        if (riderRating === 0) return;
        // If low rating and no comment, ask for comment
        if (riderRating <= 2 && !riderComment.trim()) {
            // Show comment box is already visible, just return to let user add comment
            return;
        }
        setCurrentStep("store");
    };

    const handleStoreNext = () => {
        // Store rating is optional in progressive mode
        if (storeRating > 0 && storeRating <= 2 && !storeComment.trim()) return;
        setCurrentStep("products");
    };

    const hasMissingLowProductComment = order.items.some(({ product }) => {
        const rating = productRatings[product.id] || 0;
        return rating > 0 && rating <= 2 && !(productComments[product.id] || "").trim();
    });

    const handleProductsSubmit = () => {
        // Compile all reviews
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

    const handleSkip = () => {
        onClose();
    };

    const handleCompleteClose = () => {
        onClose();
        // Reset state
        setTimeout(() => {
            setCurrentStep("rider");
            setRiderRating(0);
            setRiderComment("");
            setStoreRating(0);
            setStoreComment("");
            setProductRatings({});
            setProductComments({});
        }, 300);
    };

    const StarRating = ({
        rating,
        onRate,
        size = "w-8 h-8",
    }: {
        rating: number;
        onRate: (rating: number) => void;
        size?: string;
    }) => {
        const [hoveredStar, setHoveredStar] = useState<number | null>(null);

        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`${size} transition-colors ${
                                star <= (hoveredStar ?? rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Overlay */}
            <div className="review-overlay" onClick={handleSkip} />

            {/* Popup */}
            <div className="review-popup-wrap">
                <div className="review-popup">
                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors z-10"
                        aria-label="Close review popup"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Step: Rider Review */}
                    {currentStep === "rider" && (
                        <div className="review-step">
                            <div className="pr-10 mb-5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full mb-3">
                                    <Sparkles className="w-3 h-3" />
                                    Delivered recently
                                </span>
                                <h3 className="text-xl font-bold text-gray-900">How was your delivery?</h3>
                                <p className="text-sm text-gray-500 mt-1">Rate {order.rider.name}, your rider</p>
                            </div>

                            <div className="relative w-20 h-20 mx-auto mb-5 ring-4 ring-amber-50 rounded-full">
                                <Image
                                    src={order.rider.photo}
                                    alt={order.rider.name}
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>

                            <div className="flex justify-center mb-5">
                                <StarRating rating={riderRating} onRate={setRiderRating} size="w-10 h-10" />
                            </div>

                            {riderRating > 0 && riderRating <= 2 && (
                                <div className="mb-5 animate-slideDown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What went wrong? (Required)
                                    </label>
                                    <textarea
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder="Tell us what happened..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        rows={4}
                                    />
                                </div>
                            )}

                            {riderRating > 2 && (
                                <div className="mb-5 animate-slideDown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Any quick note? (Optional)
                                    </label>
                                    <textarea
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder="Anything we should know..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleRiderNext}
                                disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim())}
                                className="w-full py-3.5 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Submit Rating
                            </button>
                        </div>
                    )}

                    {/* Step: Store Review (stealth follow-up) */}
                    {currentStep === "store" && (
                        <div className="review-step">
                            <div className="pr-10 mb-6">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full mb-3">
                                    Optional
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">Thanks — one quick follow-up?</h3>
                                <p className="text-sm text-gray-500 mt-1">How was {order.store.name} overall?</p>
                            </div>

                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <StoreIcon className="w-8 h-8 text-yellow-600" />
                            </div>

                            <div className="flex justify-center mb-5">
                                <StarRating rating={storeRating} onRate={setStoreRating} size="w-9 h-9" />
                            </div>

                            {storeRating > 0 && storeRating <= 2 && (
                                <div className="mb-5 animate-slideDown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tell us what was wrong (Required for low ratings)
                                    </label>
                                    <textarea
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder="Your feedback helps us improve..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        rows={3}
                                    />
                                </div>
                            )}

                            {storeRating > 2 && (
                                <div className="mb-5 animate-slideDown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comment (Optional)
                                    </label>
                                    <textarea
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder="Anything to share?"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentStep("products")}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleStoreNext}
                                    disabled={storeRating > 0 && storeRating <= 2 && !storeComment.trim()}
                                    className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Product Reviews (stealth follow-up) */}
                    {currentStep === "products" && (
                        <div className="review-step">
                            <div className="pr-10 mb-6">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full mb-3">
                                    Optional
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">Last quick thing</h3>
                                <p className="text-sm text-gray-500 mt-1">Rate any items you want</p>
                            </div>

                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-yellow-600" />
                            </div>

                            <div className="max-h-80 overflow-y-auto space-y-3 mb-6 scrollbar-hide pr-1">
                                {order.items.map(({ product, quantity }) => (
                                    <div
                                        key={product.id}
                                        className="border border-gray-200 rounded-xl p-3.5 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-start gap-3 mb-2.5">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={48}
                                                height={48}
                                                className="rounded-lg object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {product.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">Qty: {quantity}</p>
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <StarRating
                                                rating={productRatings[product.id] || 0}
                                                onRate={(rating) =>
                                                    setProductRatings((prev) => ({ ...prev, [product.id]: rating }))
                                                }
                                                size="w-5 h-5"
                                            />
                                        </div>

                                        {productRatings[product.id] > 0 && productRatings[product.id] <= 2 && (
                                            <textarea
                                                value={productComments[product.id] || ""}
                                                onChange={(e) =>
                                                    setProductComments((prev) => ({
                                                        ...prev,
                                                        [product.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder="What was the issue? (Required for low ratings)"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                rows={2}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleProductsSubmit}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Skip & Finish
                                </button>
                                <button
                                    onClick={handleProductsSubmit}
                                    disabled={hasMissingLowProductComment}
                                    className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === "complete" && (
                        <div className="review-step text-center py-2">
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-scaleIn">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanks for your feedback</h3>
                            <p className="text-gray-600 mb-8">This helps us improve deliveries and product quality.</p>
                            <button
                                onClick={handleCompleteClose}
                                className="w-full py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Skip link */}
                    {currentStep !== "complete" && (
                        <button
                            onClick={handleSkip}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4 transition-colors"
                        >
                            Maybe later
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
