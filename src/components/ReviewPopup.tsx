"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import {
    X,
    Star,
    Check,
    ThumbsUp,
    ThumbsDown,
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

const AUTO_CLOSE_MS = 3500;

/* ───────── Inline StarRow (no hover on mobile) ───────── */
function StarRow({
    value,
    onChange,
    size = 24,
}: {
    value: number;
    onChange: (v: number) => void;
    size?: number;
}) {
    return (
        <div style={{ display: "flex", gap: size < 20 ? 0 : 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    className="rvStar"
                    onClick={() => onChange(s)}
                    aria-label={`${s} star`}
                >
                    <Star
                        size={size}
                        fill={s <= value ? "#FFC043" : "none"}
                        color={s <= value ? "#FFC043" : "#D0D0D0"}
                        strokeWidth={1.8}
                    />
                </button>
            ))}
        </div>
    );
}

/* ════════════════════════════════════════════════════════ */
export default function ReviewPopup({
    order,
    isOpen,
    onClose,
    onSubmit,
}: ReviewPopupProps) {
    const [step, setStep] = useState<ReviewStep>("rider");
    const [riderRating, setRiderRating] = useState(0);
    const [riderComment, setRiderComment] = useState("");
    const [storeRating, setStoreRating] = useState(0);
    const [storeComment, setStoreComment] = useState("");
    const [productRatings, setProductRatings] = useState<Record<number, number>>({});
    const [productComments, setProductComments] = useState<Record<number, string>>({});
    const [riderTags, setRiderTags] = useState<string[]>([]);
    const [storeTags, setStoreTags] = useState<string[]>([]);
    const [expandedPid, setExpandedPid] = useState<number | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── auto-close on complete ── */
    useEffect(() => {
        if (step === "complete") {
            autoCloseRef.current = setTimeout(() => closeAndReset(), AUTO_CLOSE_MS);
        }
        return () => {
            if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const ratedCount = useMemo(
        () => order.items.filter(({ product }) => (productRatings[product.id] || 0) > 0).length,
        [order.items, productRatings],
    );

    if (!isOpen) return null;

    /* ── helpers ── */
    const toggle = (tag: string, arr: string[], set: (a: string[]) => void) =>
        set(arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag]);

    const closeAndReset = () => {
        if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
        onClose();
        setTimeout(() => {
            setStep("rider");
            setRiderRating(0);
            setRiderComment("");
            setStoreRating(0);
            setStoreComment("");
            setProductRatings({});
            setProductComments({});
            setRiderTags([]);
            setStoreTags([]);
            setExpandedPid(null);
        }, 350);
    };

    const dismiss = () => onClose();

    const goStore = () => {
        if (riderRating === 0) return;
        if (riderRating <= 2 && !riderComment.trim() && riderTags.length === 0) return;
        setStep("store");
    };

    const goProducts = () => {
        if (storeRating > 0 && storeRating <= 2 && !storeComment.trim() && storeTags.length === 0) return;
        setStep("products");
    };

    const submitAll = () => {
        const riderReview: RiderReview = {
            orderId: order.id,
            riderId: order.rider.id,
            rating: riderRating,
            comment: [...riderTags, riderComment].filter(Boolean).join(". ") || undefined,
        };
        const storeReview: StoreReview = {
            orderId: order.id,
            storeId: order.store.id,
            rating: storeRating,
            comment: [...storeTags, storeComment].filter(Boolean).join(". ") || undefined,
        };
        const productReviews: ProductReview[] = order.items.map((item) => ({
            orderId: order.id,
            productId: item.product.id,
            rating: productRatings[item.product.id] || 0,
            comment: productComments[item.product.id] || undefined,
        }));
        onSubmit({ rider: riderReview, store: storeReview, products: productReviews });
        setStep("complete");
    };

    const hasMissingLow = order.items.some(({ product }) => {
        const r = productRatings[product.id] || 0;
        return r > 0 && r <= 2 && !(productComments[product.id] || "").trim();
    });

    const handleProductRate = (pid: number, r: number) => {
        setProductRatings((prev) => ({ ...prev, [pid]: r }));
        if (r <= 2) setExpandedPid(pid);
        else if (expandedPid === pid) setExpandedPid(null);
    };

    /* ════════ RENDER ════════ */
    return (
        <>
            {/* dim overlay */}
            <div className="rv__overlay" onClick={dismiss} />

            <div className="rv__positioner">
                <div className="rv__sheet">
                    {/* ── pill handle ── */}
                    <div className="rv__handle-row">
                        <span className="rv__pill" />
                    </div>

                    {/* ── close X ── */}
                    <button className="rv__x" onClick={step === "complete" ? closeAndReset : dismiss} aria-label="Close">
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {/* ═══════════ RIDER ═══════════ */}
                    {step === "rider" && (
                        <div className="rv__body rv__fade">
                            <div className="rv__avatar">
                                <Image src={order.rider.photo} alt={order.rider.name} fill className="rv__avatar-img" />
                            </div>
                            <h2 className="rv__title">How was your delivery?</h2>
                            <p className="rv__sub">{order.rider.name} · {order.rider.vehicle}</p>

                            <div className="rv__thumbs">
                                <button
                                    type="button"
                                    className={`rv__thumb ${riderRating > 0 && riderRating <= 2 ? "rv__thumb--neg" : ""}`}
                                    onClick={() => setRiderRating(1)}
                                >
                                    <ThumbsDown size={26} />
                                </button>
                                <button
                                    type="button"
                                    className={`rv__thumb ${riderRating >= 4 ? "rv__thumb--pos" : ""}`}
                                    onClick={() => setRiderRating(5)}
                                >
                                    <ThumbsUp size={26} />
                                </button>
                            </div>

                            {riderRating > 0 && (
                                <div className="rv__expand">
                                    <StarRow value={riderRating} onChange={setRiderRating} />

                                    <div className="rv__chips">
                                        {(riderRating <= 2 ? RIDER_TAGS_NEGATIVE : RIDER_TAGS_POSITIVE).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                className={`rv__chip ${riderTags.includes(t) ? "rv__chip--on" : ""}`}
                                                onClick={() => toggle(t, riderTags, setRiderTags)}
                                            >{t}</button>
                                        ))}
                                    </div>

                                    <textarea
                                        className="rv__input"
                                        value={riderComment}
                                        onChange={(e) => setRiderComment(e.target.value)}
                                        placeholder={riderRating <= 2 ? "Tell us what went wrong…" : "Add a comment (optional)"}
                                        rows={2}
                                    />
                                    {riderRating <= 2 && !riderComment.trim() && riderTags.length === 0 && (
                                        <p className="rv__warn">Please select a tag or add a comment</p>
                                    )}
                                </div>
                            )}

                            <button
                                className="rv__cta"
                                disabled={riderRating === 0 || (riderRating <= 2 && !riderComment.trim() && riderTags.length === 0)}
                                onClick={goStore}
                            >
                                Submit
                            </button>

                            <button className="rv__skip" onClick={dismiss}>Not now</button>
                        </div>
                    )}

                    {/* ═══════════ STORE ═══════════ */}
                    {step === "store" && (
                        <div className="rv__body rv__fade">
                            <div className="rv__emoji-wrap"><span className="rv__emoji">🏪</span></div>
                            <h2 className="rv__title">How was {order.store.name}?</h2>
                            <p className="rv__sub">Optional — skip if you prefer</p>

                            <div className="rv__thumbs">
                                <button
                                    type="button"
                                    className={`rv__thumb ${storeRating > 0 && storeRating <= 2 ? "rv__thumb--neg" : ""}`}
                                    onClick={() => setStoreRating(1)}
                                >
                                    <ThumbsDown size={22} />
                                </button>
                                <button
                                    type="button"
                                    className={`rv__thumb ${storeRating >= 4 ? "rv__thumb--pos" : ""}`}
                                    onClick={() => setStoreRating(5)}
                                >
                                    <ThumbsUp size={22} />
                                </button>
                            </div>

                            {storeRating > 0 && (
                                <div className="rv__expand">
                                    <StarRow value={storeRating} onChange={setStoreRating} />
                                    <div className="rv__chips">
                                        {(storeRating <= 2 ? STORE_TAGS_NEGATIVE : STORE_TAGS_POSITIVE).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                className={`rv__chip ${storeTags.includes(t) ? "rv__chip--on" : ""}`}
                                                onClick={() => toggle(t, storeTags, setStoreTags)}
                                            >{t}</button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="rv__input"
                                        value={storeComment}
                                        onChange={(e) => setStoreComment(e.target.value)}
                                        placeholder={storeRating <= 2 ? "What went wrong?" : "Add a comment (optional)"}
                                        rows={2}
                                    />
                                    {storeRating > 0 && storeRating <= 2 && !storeComment.trim() && storeTags.length === 0 && (
                                        <p className="rv__warn">Please select a tag or add a comment</p>
                                    )}
                                </div>
                            )}

                            <div className="rv__row-btns">
                                <button className="rv__cta rv__cta--ghost" onClick={() => setStep("products")}>Skip</button>
                                <button
                                    className="rv__cta"
                                    disabled={storeRating > 0 && storeRating <= 2 && !storeComment.trim() && storeTags.length === 0}
                                    onClick={goProducts}
                                >
                                    Submit
                                </button>
                            </div>
                            <button className="rv__skip" onClick={dismiss}>Not now</button>
                        </div>
                    )}

                    {/* ═══════════ PRODUCTS ═══════════ */}
                    {step === "products" && (
                        <div className="rv__body rv__fade">
                            <h2 className="rv__title">Rate your items</h2>
                            <p className="rv__sub">
                                {ratedCount}/{order.items.length} rated · optional
                            </p>

                            <div className="rv__plist" ref={listRef}>
                                {order.items.map((item) => {
                                    const r = productRatings[item.product.id] || 0;
                                    const open = expandedPid === item.product.id && r > 0 && r <= 2;
                                    return (
                                        <div key={item.product.id} className={`rv__prow ${r > 0 ? "rv__prow--done" : ""}`}>
                                            <div className="rv__prow-top">
                                                <div className="rv__prow-thumb">
                                                    <Image
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        width={40}
                                                        height={40}
                                                        className="rv__prow-img"
                                                    />
                                                    {r > 0 && (
                                                        <span className="rv__prow-badge"><Check size={10} strokeWidth={3} /></span>
                                                    )}
                                                </div>
                                                <div className="rv__prow-info">
                                                    <span className="rv__prow-name">{item.product.name}</span>
                                                    <span className="rv__prow-meta">×{item.quantity}{item.product.weight ? ` · ${item.product.weight}` : ""}</span>
                                                </div>
                                                <StarRow
                                                    value={r}
                                                    onChange={(v) => handleProductRate(item.product.id, v)}
                                                    size={16}
                                                />
                                            </div>
                                            {open && (
                                                <textarea
                                                    className="rv__input rv__input--sm"
                                                    value={productComments[item.product.id] || ""}
                                                    onChange={(e) =>
                                                        setProductComments((p) => ({ ...p, [item.product.id]: e.target.value }))
                                                    }
                                                    placeholder="What was wrong?"
                                                    rows={2}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rv__row-btns">
                                <button className="rv__cta rv__cta--ghost" onClick={submitAll}>Skip</button>
                                <button className="rv__cta" disabled={hasMissingLow} onClick={submitAll}>Submit</button>
                            </div>
                            <button className="rv__skip" onClick={dismiss}>Not now</button>
                        </div>
                    )}

                    {/* ═══════════ DONE ═══════════ */}
                    {step === "complete" && (
                        <div className="rv__body rv__fade rv__body--done">
                            <div className="rv__done-ring">
                                <Check size={36} strokeWidth={2.5} />
                            </div>
                            <h2 className="rv__title">Thanks for your feedback!</h2>
                            <p className="rv__sub rv__sub--narrow">Your ratings help us improve the experience for everyone.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
