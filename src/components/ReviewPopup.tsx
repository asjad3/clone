"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Order, RiderReview, StoreReview, ProductReview } from "@/types";
import { X, Check, ThumbsUp, ThumbsDown, Camera } from "lucide-react";
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

type ReviewStep = "rider" | "store" | "complete";
type Sentiment = "dislike" | "okay" | "love" | null;

const sentimentToRating = (s: Sentiment): number =>
    s === "dislike" ? 2 : s === "okay" ? 3 : s === "love" ? 5 : 0;

const RIDER_TAGS: Record<string, string[]> = {
    dislike: ["Late delivery", "Unfriendly", "Damaged items", "Wrong order"],
    okay: ["On time", "Could be better", "Average"],
    love: ["On time", "Friendly", "Careful with items", "Great service"],
};

const STORE_TAGS: Record<string, string[]> = {
    dislike: ["Bad value", "Inconsistent", "Poor packaging", "Bad quality", "Missing items"],
    okay: ["Average quality", "Decent value", "Acceptable"],
    love: ["Great value", "Consistent", "Well-packaged", "Excellent quality", "Flavorful"],
};

const SENTIMENT_META: Record<string, { label: string; sub: string }> = {
    dislike: { label: "Didn't like", sub: "What issues did you have?" },
    okay: { label: "Liked", sub: "What's worth highlighting?" },
    love: { label: "Loved", sub: "What made it great?" },
};

const SENTIMENT_LABELS: Record<string, string> = {
    dislike: "Bad",
    okay: "Good",
    love: "Great",
};

const AUTO_CLOSE_MS = 2800;
const COLLAPSE_PX = 180;

/* ── Sentiment Icons (inline SVG, not emoji) ── */
const SentimentIcon = ({ type, size = 22 }: { type: "dislike" | "okay" | "love"; size?: number }) => {
    if (type === "dislike") return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
            <path d="M9 22h1c1 0 2-1 2-2v-4h4.7c.5 0 .9-.1 1.3-.4.4-.3.6-.6.7-1.1l1.8-7.2c.1-.3 0-.6-.1-.9-.2-.3-.5-.4-.8-.4H13V3c0-.5-.2-1-.6-1.4C12 1.2 11.5 1 11 1l-2 7v14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M4 22V10H2v12h2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    );
    if (type === "okay") return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
            <path d="M15 2h-1c-1 0-2 1-2 2v4H7.3c-.5 0-.9.1-1.3.4-.4.3-.6.6-.7 1.1L3.5 16.7c-.1.3 0 .6.1.9.2.3.5.4.8.4H11v3c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6l2-7V2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M20 2v12h2V2h-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    );
    return (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    );
};

function SentimentPicker({ value, onChange }: { value: Sentiment; onChange: (v: Sentiment) => void }) {
    const opts: { key: Sentiment; label: string }[] = [
        { key: "dislike", label: SENTIMENT_LABELS.dislike },
        { key: "okay", label: SENTIMENT_LABELS.okay },
        { key: "love", label: SENTIMENT_LABELS.love },
    ];
    return (
        <div className="rv__row-icons">
            {opts.map((opt) => (
                <div key={opt.key} className={`rv__icon-wrap${value === opt.key ? " rv__icon-wrap--on" : ""}`}>
                    <button
                        type="button"
                        className={`rv__icon-btn ${value === opt.key ? "rv__icon-btn--on" : ""}`}
                        onClick={() => onChange(opt.key)}
                        aria-label={opt.key!}
                    >
                        <SentimentIcon type={opt.key!} />
                    </button>
                    <span className="rv__icon-label">{opt.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ════════════════════════════════════════ */
export default function ReviewPopup({ order, isOpen, onClose, onSubmit }: ReviewPopupProps) {
    const [step, setStep] = useState<ReviewStep>("rider");
    const [riderSentiment, setRiderSentiment] = useState<Sentiment>(null);
    const [riderTags, setRiderTags] = useState<string[]>([]);
    const [riderComment, setRiderComment] = useState("");
    const [storeSentiment, setStoreSentiment] = useState<Sentiment>(null);
    const [storeTags, setStoreTags] = useState<string[]>([]);
    const [storeComment, setStoreComment] = useState("");
    const [productVotes, setProductVotes] = useState<Record<number, "up" | "down">>({});
    const [collapsed, setCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (step === "complete") autoRef.current = setTimeout(closeAndReset, AUTO_CLOSE_MS);
        return () => { if (autoRef.current) clearTimeout(autoRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    useEffect(() => {
        setCollapsed(false);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [step]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        setCollapsed(scrollRef.current.scrollTop > COLLAPSE_PX);
    }, []);

    const votedCount = useMemo(() => Object.keys(productVotes).length, [productVotes]);

    if (!isOpen) return null;

    const toggle = (t: string, arr: string[], set: (a: string[]) => void) =>
        set(arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeAndReset = () => {
        if (autoRef.current) clearTimeout(autoRef.current);
        onClose();
        setTimeout(() => {
            setStep("rider"); setRiderSentiment(null); setRiderComment(""); setRiderTags([]);
            setStoreSentiment(null); setStoreComment(""); setStoreTags([]);
            setProductVotes({}); setCollapsed(false);
        }, 350);
    };

    const dismiss = () => onClose();

    const goStore = () => { if (riderSentiment) setStep("store"); };

    const submitAll = () => {
        onSubmit({
            rider: { orderId: order.id, riderId: order.rider.id, rating: sentimentToRating(riderSentiment), comment: [...riderTags, riderComment].filter(Boolean).join(". ") || undefined },
            store: { orderId: order.id, storeId: order.store.id, rating: sentimentToRating(storeSentiment), comment: [...storeTags, storeComment].filter(Boolean).join(". ") || undefined },
            products: order.items.map((i) => ({ orderId: order.id, productId: i.product.id, rating: productVotes[i.product.id] === "up" ? 5 : productVotes[i.product.id] === "down" ? 1 : 0 })),
        });
        setStep("complete");
    };

    const rMeta = riderSentiment ? SENTIMENT_META[riderSentiment] : null;
    const sMeta = storeSentiment ? SENTIMENT_META[storeSentiment] : null;

    return (
        <>
            <div className="rv__overlay" onClick={dismiss} />
            <div className="rv__pos">
                <div className={`rv__sheet${step === "store" ? " rv__sheet--full" : ""}`}>

                    {/* ── Drag handle ── */}
                    <div className="rv__handle"><div className="rv__handle-bar" /></div>

                    {/* ── Header bar ── */}
                    <div className="rv__hdr">
                        <button className="rv__x" onClick={step === "complete" ? closeAndReset : dismiss} aria-label="Close">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                        {step !== "complete" && <span className="rv__hdr-name">{order.store.name}</span>}
                        {step !== "complete" ? (
                            <div className="rv__step-dots">
                                <div className={`rv__step-dot${step === "rider" ? " rv__step-dot--active" : " rv__step-dot--done"}`} />
                                <div className={`rv__step-dot${step === "store" ? " rv__step-dot--active" : ""}`} />
                            </div>
                        ) : <div style={{ width: 30 }} />}
                    </div>

                    {/* ═══════ RIDER ═══════ */}
                    {step === "rider" && (
                        <div className="rv__scroll rv__fade">
                            {/* Centered hero area */}
                            <div className="rv__rider-center">
                                <p className="rv__section-title">How was your delivery?</p>

                                <div className="rv__rider">
                                    <div className="rv__rider-ava">
                                        <Image src={order.rider.photo} alt={order.rider.name} fill className="rv__rider-img" />
                                    </div>
                                    <span className="rv__rider-nm">{order.rider.name}</span>
                                    <span className="rv__rider-role">Delivery Partner</span>
                                </div>

                                <SentimentPicker value={riderSentiment} onChange={setRiderSentiment} />

                                {rMeta && (
                                    <div className="rv__label-block rv__fade">
                                        <strong className="rv__lb-title">{rMeta.label}</strong>
                                        <span className="rv__lb-sub">{rMeta.sub}</span>
                                    </div>
                                )}
                            </div>

                            {/* Tags + comment below center */}
                            <div className="rv__pad">
                                {riderSentiment && (
                                    <div className="rv__pills rv__fade">
                                        {RIDER_TAGS[riderSentiment].map((t) => (
                                            <button key={t} type="button" className={`rv__pill${riderTags.includes(t) ? " rv__pill--on" : ""}`} onClick={() => toggle(t, riderTags, setRiderTags)}>{t}</button>
                                        ))}
                                    </div>
                                )}

                                {riderSentiment && (
                                    <div className="rv__write rv__fade">
                                        <span className="rv__write-hd">Leave a comment</span>
                                        <textarea className="rv__ta" value={riderComment} onChange={(e) => setRiderComment(e.target.value)} placeholder={riderSentiment === "dislike" ? "What could be improved?" : "Share what stood out"} rows={2} />
                                        <button type="button" className="rv__photo-btn">
                                            <Camera size={15} strokeWidth={2} />
                                            <span>Add photo</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sticky CTA */}
                            <div className="rv__bot">
                                <button className="rv__cta" disabled={!riderSentiment} onClick={goStore}>
                                    Next:  Rate {order.store.name}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══════ STORE + PRODUCTS ═══════ */}
                    {step === "store" && (
                        <div className="rv__full-layout rv__fade">

                            {/* ── Collapsed sticky header ── */}
                            <div className={`rv__bar${collapsed ? " rv__bar--on" : ""}`}>
                                <div className="rv__bar-top">
                                    <div className="rv__bar-left">
                                        <div className="rv__bar-store">
                                            <span className="rv__bar-store-name">{order.store.name}</span>
                                        </div>
                                        <SentimentPicker value={storeSentiment} onChange={setStoreSentiment} />
                                        {sMeta && <span className="rv__bar-badge">{sMeta.label}</span>}
                                    </div>
                                    <div className="rv__bar-right">
                                        <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>
                                            {votedCount}/{order.items.length} rated
                                        </span>
                                        <button className="rv__bar-up" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {storeTags.length > 0 && (
                                    <div className="rv__bar-tags">
                                        {storeTags.map((t) => <span key={t} className="rv__bar-tag">{t}</span>)}
                                    </div>
                                )}
                                <div className="rv__bar-prog"><div className="rv__bar-fill" style={{ width: `${order.items.length > 0 ? (votedCount / order.items.length) * 100 : 0}%` }} /></div>
                            </div>

                            {/* ── Scrollable ── */}
                            <div className="rv__scroll-full" ref={scrollRef} onScroll={handleScroll}>
                                <div className="rv__pad">
                                    <p className="rv__section-title" style={{ textAlign: 'left', marginTop: 4 }}>Rate your order</p>
                                    <p className="rv__section-sub" style={{ textAlign: 'left' }}>How was the food from {order.store.name}?</p>

                                    {/* Store review */}
                                    <SentimentPicker value={storeSentiment} onChange={setStoreSentiment} />

                                    {sMeta && (
                                        <div className="rv__label-block rv__fade">
                                            <strong className="rv__lb-title">{sMeta.label}</strong>
                                            <span className="rv__lb-sub">{sMeta.sub}</span>
                                        </div>
                                    )}

                                    {storeSentiment && (
                                        <div className="rv__pills rv__fade">
                                            {STORE_TAGS[storeSentiment].map((t) => (
                                                <button key={t} type="button" className={`rv__pill${storeTags.includes(t) ? " rv__pill--on" : ""}`} onClick={() => toggle(t, storeTags, setStoreTags)}>{t}</button>
                                            ))}
                                        </div>
                                    )}

                                    {storeSentiment && (
                                        <div className="rv__write rv__fade">
                                            <span className="rv__write-hd">Share your experience</span>
                                            <textarea className="rv__ta" value={storeComment} onChange={(e) => setStoreComment(e.target.value)} placeholder={storeSentiment === "love" ? `What made ${order.store.name} outstanding?` : storeSentiment === "okay" ? `What was solid about ${order.store.name}?` : `What didn't meet expectations?`} rows={2} />
                                            <button type="button" className="rv__photo-btn">
                                                <Camera size={15} strokeWidth={2} />
                                                <span>Add photo</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Products */}
                                <div className="rv__prod-section">
                                    <div className="rv__pad">
                                        <h3 className="rv__prod-hd">Rate your items</h3>

                                    </div>
                                    {order.items.map((item) => {
                                        const v = productVotes[item.product.id] || null;
                                        return (
                                            <div key={item.product.id} className="rv__prod-row">
                                                <div className="rv__prod-thumb">
                                                    <Image src={item.product.image} alt={item.product.name} width={52} height={52} className="rv__prod-img" />
                                                </div>
                                                <div className="rv__prod-info">
                                                    <span className="rv__prod-nm">{item.product.name}</span>
                                                    <span className="rv__prod-pr">Rs. {item.product.price}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                                                </div>
                                                <div className="rv__prod-btns">
                                                    <button type="button" className={`rv__vb${v === "down" ? " rv__vb--dn" : ""}`} onClick={() => setProductVotes((p) => { const cp = { ...p }; if (v === "down") delete cp[item.product.id]; else cp[item.product.id] = "down"; return cp; })} aria-label="Thumbs down">
                                                        <ThumbsDown size={15} strokeWidth={2} />
                                                    </button>
                                                    <button type="button" className={`rv__vb${v === "up" ? " rv__vb--up" : ""}`} onClick={() => setProductVotes((p) => { const cp = { ...p }; if (v === "up") delete cp[item.product.id]; else cp[item.product.id] = "up"; return cp; })} aria-label="Thumbs up">
                                                        <ThumbsUp size={15} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ height: 72 }} />
                            </div>

                            <div className="rv__bot rv__bot--border">
                                <button className="rv__cta" onClick={submitAll}>Submit Review</button>
                            </div>
                        </div>
                    )}

                    {/* ═══════ DONE ═══════ */}
                    {step === "complete" && (
                        <div className="rv__done rv__fade">
                            <div className="rv__done-icon"><Check size={30} strokeWidth={2.5} /></div>
                            <h2 className="rv__done-h">Thanks for your feedback!</h2>
                            <p className="rv__done-p">Your review helps {order.store.name} improve and helps others make better choices.</p>
                            <div className="rv__done-bar">
                                <div className="rv__done-bar-fill" style={{ "--auto-close-ms": `${AUTO_CLOSE_MS}ms` } as React.CSSProperties} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
