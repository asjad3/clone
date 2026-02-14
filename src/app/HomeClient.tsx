"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronRight, Zap, Truck, Store, ShoppingCart, Gift, X } from "lucide-react";
import Header from "@/components/Header";
import { useAreaStore } from "@/store/area";
import { useSession, signIn } from "next-auth/react";
import { Area, Store as StoreType } from "@/types";

interface AreaWithStats extends Area {
    storeCount?: number;
}

interface HomeClientProps {
    areas: AreaWithStats[];
    stores: StoreType[];
}

const AREA_MODAL_SEEN_KEY = "lootmart-area-modal-seen";

export default function HomeClient({ areas, stores }: HomeClientProps) {
    const { selectedArea, setArea } = useAreaStore();
    const { data: session } = useSession();
    const [showAreaModal, setShowAreaModal] = useState(false);
    const [filteredStores, setFilteredStores] = useState(stores);
    const [mounted, setMounted] = useState(false);
    // useTransition for non-blocking area selection updates
    const [isPending, startTransition] = useTransition();

    // Hydration safety
    useEffect(() => {
        const raf = window.requestAnimationFrame(() => {
            setMounted(true);

            const hasSeenAreaModal = window.localStorage.getItem(AREA_MODAL_SEEN_KEY) === "true";
            if (!hasSeenAreaModal) {
                window.setTimeout(() => {
                    setShowAreaModal(true);
                }, 0);
            }
        });

        return () => window.cancelAnimationFrame(raf);
    }, []);

    const closeAreaModal = useCallback(() => {
        setShowAreaModal(false);
        window.localStorage.setItem(AREA_MODAL_SEEN_KEY, "true");
    }, []);

    // Filter stores when area changes (wrapped in useTransition)
    useEffect(() => {
        startTransition(() => {
            if (selectedArea) {
                const matching = stores.filter((s) => s.areas.includes(selectedArea.id));
                setFilteredStores(matching.length > 0 ? matching : stores);
            } else {
                setFilteredStores(stores);
            }
        });
    }, [selectedArea, stores, startTransition]);

    const handleAreaSelect = useCallback(
        (area: Area) => {
            startTransition(() => {
                setArea(area);
                setShowAreaModal(false);
                window.localStorage.setItem(AREA_MODAL_SEEN_KEY, "true");
                setTimeout(() => {
                    document.getElementById("stores-section")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            });
        },
        [setArea, startTransition]
    );

    const storeCount = filteredStores.length;

    return (
        <>
            <Header variant="home" onAreaSelect={handleAreaSelect} />

            <main className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
                    {/* Welcome Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#1E2A3B" }}>
                            Welcome to
                        </h1>
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Image
                                src="https://www.lootmart.com.pk/_next/image?url=%2Flogo-header-300x147.png&w=384&q=75"
                                alt="LootMart"
                                width={384}
                                height={188}
                                className="h-20 md:h-28 w-auto"
                                priority
                            />
                        </div>
                        <p className="text-gray-500 text-sm md:text-base mb-6">
                            Your one-stop shop for convenient grocery delivery
                        </p>

                        {/* Select area button */}
                        <button
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm ${mounted && selectedArea
                                    ? "border-none text-white"
                                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#E5A528] hover:bg-[#FEF9EC]"
                                }`}
                            style={
                                mounted && selectedArea
                                    ? { background: "#E5A528" }
                                    : {}
                            }
                            onClick={() => setShowAreaModal(true)}
                        >
                            <MapPin className="w-4 h-4" />
                            <span>{mounted && selectedArea ? selectedArea.name : "Select your area"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Feature Cards Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                        {[
                            { icon: Zap, title: "Same-Day", sub: "Fast delivery", bg: "#E8F5E9", color: "text-green-600" },
                            { icon: Truck, title: "Free Delivery", sub: "On free orders", bg: "#FFF3E0", color: "text-orange-500" },
                            { icon: Store, title: "Multi-Store", sub: "All in one place", bg: "#E3F2FD", color: "text-blue-500" },
                            { icon: ShoppingCart, title: "Easy Order", sub: "Quick checkout", bg: "#F3E5F5", color: "text-purple-500" },
                        ].map(({ icon: Icon, title, sub, bg, color }) => (
                            <div key={title} className="feature-card">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: bg }}
                                >
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-gray-900">{title}</div>
                                    <div className="text-xs text-gray-500">{sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Green Promo Banner */}
                    <div
                        className="rounded-2xl p-5 md:p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-4"
                        style={{ background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                <Gift className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">
                                    Get Free Delivery on Your Orders! 🎉
                                </div>
                                <div className="text-xs text-gray-600">
                                    Sign up now and enjoy free delivery from all available stores
                                </div>
                            </div>
                        </div>
                        <button
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 flex-shrink-0 transition-all hover:shadow-lg"
                            style={{ background: "#E5A528" }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#C4881C")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "#E5A528")}
                            onClick={() => {
                                if (!session) signIn("google");
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                            </svg>
                            {session ? "Welcome back!" : "Sign up with Google"}
                        </button>
                    </div>

                    {/* Stores Section */}
                    <div className="text-center mb-6" id="stores-section">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                            Stores in{" "}
                            <span style={{ color: mounted && selectedArea ? "#1a3a5c" : "#E5A528", fontWeight: 700 }}>
                                {mounted && selectedArea ? selectedArea.name : "your area"}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500">
                            {isPending
                                ? "Updating store list..."
                                : mounted && selectedArea
                                    ? `${storeCount} store${storeCount !== 1 ? "s" : ""} deliver${storeCount === 1 ? "s" : ""} to your area`
                                    : "Select an area to see available stores"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                        {filteredStores.map((s) => (
                            <Link
                                key={s.id}
                                href={`/store/${s.slug}${mounted && selectedArea ? `?area=${encodeURIComponent(selectedArea.name)}` : ""}`}
                                className="store-card"
                                prefetch={true}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: "#FEF9EC" }}
                                    >
                                        <Store className="w-6 h-6" style={{ color: "#E5A528" }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{s.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {s.store_type === "mart" ? "Grocery Mart" : s.store_type}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                                    {s.same_day_delivery && (
                                        <>
                                            <span className="flex items-center gap-1 text-green-600">
                                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                Same-day
                                            </span>
                                            <span className="text-gray-300">|</span>
                                        </>
                                    )}
                                    <span>Delivery: Rs. {s.delivery_charges}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Free over Rs. {s.free_delivery_threshold}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Area Selection Modal */}
            {showAreaModal && (
                <div className="modal-overlay" onClick={closeAreaModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Choose delivery area</h2>
                            <button
                                onClick={closeAreaModal}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">
                            Select your location to see available stores
                        </p>
                        <div className="space-y-2">
                            {areas.map((a) => (
                                <div key={a.id} className="area-card" onClick={() => handleAreaSelect(a)}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm text-gray-900">{a.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{a.city}</div>
                                        </div>
                                        {"storeCount" in a && (
                                            <span className="text-xs text-gray-400">
                                                {a.storeCount} store{a.storeCount !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
