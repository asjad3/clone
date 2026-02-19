"use client";

import { useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import { X, Star, CheckCircle, Package, Store as StoreIcon } from "lucide-react";
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
        if (storeRating === 0) return;
        if (storeRating <= 2 && !storeComment.trim()) {
            return;
        }
        setCurrentStep("products");
    };

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
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Progress indicator */}
                <div className="flex gap-2 mb-6">
                    <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            currentStep === "rider" || currentStep === "store" || currentStep === "products"
                                ? "bg-yellow-400"
                                : "bg-gray-200"
                        }`}
                    />
                    <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            currentStep === "store" || currentStep === "products" ? "bg-yellow-400" : "bg-gray-200"
                        }`}
                    />
                    <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            currentStep === "products" ? "bg-yellow-400" : "bg-gray-200"
                        }`}
                    />
                </div>

                {/* Step: Rider Review */}
                {currentStep === "rider" && (
                    <div className="review-step">
                        <div className="text-center mb-6">
                            <div className="relative w-20 h-20 mx-auto mb-4">
                                <Image
                                    src={order.rider.photo}
                                    alt={order.rider.name}
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                How was your delivery?
                            </h3>
                            <p className="text-sm text-gray-500">Your rider was {order.rider.name}</p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <StarRating rating={riderRating} onRate={setRiderRating} size="w-10 h-10" />
                        </div>

                        {riderRating > 0 && riderRating <= 2 && (
                            <div className="mb-6 animate-slideDown">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    What went wrong? (Required for low ratings)
                                </label>
                                <textarea
                                    value={riderComment}
                                    onChange={(e) => setRiderComment(e.target.value)}
                                    placeholder="Tell us what happened..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={4}
                                />
                            </div>
                        )}

                        {riderRating > 2 && (
                            <div className="mb-6 animate-slideDown">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional comments (Optional)
                                </label>
                                <textarea
                                    value={riderComment}
                                    onChange={(e) => setRiderComment(e.target.value)}
                                    placeholder="Any additional feedback..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={3}
                                />
                            </div>
                        )}

                        <button
                            onClick={handleRiderNext}
                            disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim())}
                            className="w-full py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step: Store Review */}
                {currentStep === "store" && (
                    <div className="review-step">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <StoreIcon className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Rate the store</h3>
                            <p className="text-sm text-gray-500">{order.store.name}</p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <StarRating rating={storeRating} onRate={setStoreRating} size="w-10 h-10" />
                        </div>

                        {storeRating > 0 && storeRating <= 2 && (
                            <div className="mb-6 animate-slideDown">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    What could be better? (Required for low ratings)
                                </label>
                                <textarea
                                    value={storeComment}
                                    onChange={(e) => setStoreComment(e.target.value)}
                                    placeholder="Tell us about your experience..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={4}
                                />
                            </div>
                        )}

                        {storeRating > 2 && (
                            <div className="mb-6 animate-slideDown">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional comments (Optional)
                                </label>
                                <textarea
                                    value={storeComment}
                                    onChange={(e) => setStoreComment(e.target.value)}
                                    placeholder="What did you enjoy?"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep("rider")}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleStoreNext}
                                disabled={storeRating === 0 || (storeRating <= 2 && !storeComment.trim())}
                                className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Product Reviews */}
                {currentStep === "products" && (
                    <div className="review-step">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Rate your products</h3>
                            <p className="text-sm text-gray-500">Help others make better choices</p>
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-4 mb-6 scrollbar-hide">
                            {order.items.map(({ product, quantity }) => (
                                <div
                                    key={product.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex items-start gap-3 mb-3">
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

                                    <div className="mb-3">
                                        <StarRating
                                            rating={productRatings[product.id] || 0}
                                            onRate={(rating) =>
                                                setProductRatings((prev) => ({ ...prev, [product.id]: rating }))
                                            }
                                            size="w-6 h-6"
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
                                            placeholder="What was the issue?"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            rows={2}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep("store")}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleProductsSubmit}
                                className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                                Submit Reviews
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Complete */}
                {currentStep === "complete" && (
                    <div className="review-step text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-scaleIn">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h3>
                        <p className="text-gray-600 mb-8">Your feedback helps us improve our service</p>
                        <button
                            onClick={handleCompleteClose}
                            className="w-full py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
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
