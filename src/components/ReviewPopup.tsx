"use client";

import { useMemo, useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import {
    X,
    Star,
    CheckCircle2,
    Package,
    Store as StoreIcon,
    Sparkles,
    Bike,
    MessageSquareText,
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

    const currentStepNumber = currentStep === "complete" ? 3 : stepFlow.indexOf(currentStep) + 1;
    const progress = (currentStepNumber / stepFlow.length) * 100;

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
        size = "w-7 h-7",
    }: {
        rating: number;
        onRate: (nextRating: number) => void;
        size?: string;
    }) => {
        const [hoveredStar, setHoveredStar] = useState<number | null>(null);

        return (
            <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="rounded-full p-1.5 transition-all hover:scale-110 hover:bg-amber-50"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                        <Star
                            className={`${size} transition-colors duration-150 ${
                                star <= (hoveredStar ?? rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300/90"
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="review-overlay" onClick={handleSkip} />

            <div className="review-popup-wrap">
                <div className="review-popup font-[family-name:var(--font-geist-sans)]">
                    <button
                        onClick={handleSkip}
                        className="absolute right-5 top-5 rounded-full border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50"
                        aria-label="Close review popup"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-100 pb-4 pr-10">
                        <div className="min-w-0">
                            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.14em] text-amber-600">
                                Order Feedback
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-gray-900">Help us improve your experience</h2>
                            <p className="mt-1 text-sm text-gray-500">Quick, progressive review • about 1 minute</p>
                        </div>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Step {currentStepNumber}/3
                        </span>
                    </div>

                    {currentStep !== "complete" && (
                        <div className="mb-6">
                            <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Bike className="h-3.5 w-3.5" />
                                    Rider
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                    <StoreIcon className="h-3.5 w-3.5" />
                                    Store
                                </div>
                                <div className="flex items-center justify-end gap-1.5">
                                    <Package className="h-3.5 w-3.5" />
                                    Products
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === "rider" && (
                        <div className="review-step space-y-4.5">
                            <div className="pr-10">
                                <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                    <Sparkles className="h-3 w-3" />
                                    Delivered recently
                                </span>
                                <h3 className="text-2xl font-semibold tracking-tight text-gray-900">How was your delivery?</h3>
                                <p className="mt-1 text-sm text-gray-500">Rate {order.rider.name}, your rider</p>
                            </div>

                            <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                                <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-amber-100">
                                    <Image src={order.rider.photo} alt={order.rider.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{order.rider.name}</p>
                                    <p className="text-xs text-gray-500">{order.rider.vehicle}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                                <div className="mb-2 flex justify-center">
                                    <StarRating rating={riderRating} onRate={setRiderRating} size="h-9 w-9" />
                                </div>
                                <p className="text-center text-xs text-gray-500">
                                    {riderRating === 0
                                        ? "Tap to rate"
                                        : riderRating <= 2
                                          ? "We’re sorry — tell us what happened"
                                          : "Great, thanks for sharing"}
                                </p>
                            </div>

                            {riderRating > 0 && (
                                <div className="animate-slideDown space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MessageSquareText className="h-4 w-4 text-gray-400" />
                                        {riderRating <= 2 ? "What went wrong? (Required)" : "Any quick note? (Optional)"}
                                    </label>
                                    <textarea
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder={riderRating <= 2 ? "Tell us what happened..." : "Anything we should know..."}
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100"
                                        rows={riderRating <= 2 ? 3 : 2}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleRiderNext}
                                disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim())}
                                className="w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {currentStep === "store" && (
                        <div className="review-step space-y-4.5">
                            <div className="pr-10">
                                <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    Optional
                                </span>
                                <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
                                    Thanks — one quick follow-up?
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">How was {order.store.name} overall?</p>
                            </div>

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
                                <StoreIcon className="h-8 w-8 text-amber-600" />
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                                <div className="mb-2 flex justify-center">
                                    <StarRating rating={storeRating} onRate={setStoreRating} size="h-8 w-8" />
                                </div>
                                <p className="text-center text-xs text-gray-500">
                                    {storeRating === 0
                                        ? "Skip if you prefer"
                                        : storeRating <= 2
                                          ? "Low ratings need a short reason"
                                          : "Awesome — thanks"}
                                </p>
                            </div>

                            {storeRating > 0 && (
                                <div className="animate-slideDown space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MessageSquareText className="h-4 w-4 text-gray-400" />
                                        {storeRating <= 2 ? "Tell us what was wrong (Required)" : "Comment (Optional)"}
                                    </label>
                                    <textarea
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder={
                                            storeRating <= 2
                                                ? "Your feedback helps us improve..."
                                                : "Anything you’d like to share?"
                                        }
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100"
                                        rows={2}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    onClick={() => setCurrentStep("products")}
                                    className="rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleStoreNext}
                                    disabled={storeRating > 0 && storeRating <= 2 && !storeComment.trim()}
                                    className="rounded-2xl bg-amber-400 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === "products" && (
                        <div className="review-step space-y-4.5">
                            <div className="pr-10">
                                <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    Optional
                                </span>
                                <h3 className="text-2xl font-semibold tracking-tight text-gray-900">Last quick thing</h3>
                                <p className="mt-1 text-sm text-gray-500">Rate any items you want from this order</p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs text-gray-600">
                                {ratedProductsCount} of {order.items.length} item{order.items.length > 1 ? "s" : ""} rated • {currentProductIndex + 1}/{order.items.length}
                            </div>

                            {currentProductItem && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 transition-colors">
                                    <div className="mb-3 flex items-start gap-3">
                                        <Image
                                            src={currentProductItem.product.image}
                                            alt={currentProductItem.product.name}
                                            width={52}
                                            height={52}
                                            className="rounded-xl border border-gray-100 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-medium text-gray-900">
                                                {currentProductItem.product.name}
                                            </h4>
                                            <p className="mt-0.5 text-xs text-gray-500">Qty: {currentProductItem.quantity}</p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={handlePrevProduct}
                                                disabled={currentProductIndex === 0}
                                                className="rounded-lg border border-gray-200 p-1 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Previous product"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleNextProduct}
                                                disabled={currentProductIndex === order.items.length - 1}
                                                className="rounded-lg border border-gray-200 p-1 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Next product"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <StarRating
                                            rating={productRatings[currentProductItem.product.id] || 0}
                                            onRate={(rating) =>
                                                setProductRatings((prev) => ({ ...prev, [currentProductItem.product.id]: rating }))
                                            }
                                            size="h-5 w-5"
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
                                                placeholder="What was the issue? (Required for low ratings)"
                                                className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100"
                                                rows={2}
                                            />
                                        )}

                                    <div className="mt-3 flex items-center justify-center gap-1.5">
                                        {order.items.map((item, index) => (
                                            <button
                                                key={item.product.id}
                                                onClick={() => setCurrentProductIndex(index)}
                                                className={`h-1.5 rounded-full transition-all ${
                                                    currentProductIndex === index ? "w-5 bg-amber-400" : "w-1.5 bg-gray-300"
                                                }`}
                                                aria-label={`Go to product ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    onClick={handleProductsSubmit}
                                    className="rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Skip & Finish
                                </button>
                                <button
                                    onClick={handleProductsSubmit}
                                    disabled={hasMissingLowProductComment}
                                    className="rounded-2xl bg-amber-400 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === "complete" && (
                        <div className="review-step py-2 text-center">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-200 bg-green-50 animate-scale-in">
                                <CheckCircle2 className="h-11 w-11 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight text-gray-900">Thanks for your feedback</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                                Your ratings help us improve delivery quality, store standards, and product freshness.
                            </p>

                            <button
                                onClick={handleCompleteClose}
                                className="mt-7 w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {currentStep !== "complete" && (
                        <button
                            onClick={handleSkip}
                            className="mt-4 w-full text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                        >
                            Maybe later
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
