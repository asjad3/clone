"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronDown, Store, ShoppingBag, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useAreaStore } from "@/store/area";
import { useCartStore } from "@/store/cart";
import { Area } from "@/types";
import { areas } from "@/data/areas";

interface HeaderProps {
    variant?: "home" | "store";
    storeName?: string;
    sameDayDelivery?: boolean;
    onAreaSelect?: (area: Area) => void;
    onCartToggle?: () => void;
}

export default function Header({
    variant = "home",
    storeName,
    sameDayDelivery,
    onAreaSelect,
    onCartToggle,
}: HeaderProps) {
    const { data: session } = useSession();
    const { selectedArea, setArea } = useAreaStore();
    const totalItems = useCartStore((s) => s.getTotalItems());
    const [locationOpen, setLocationOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [mobileAreaSheet, setMobileAreaSheet] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setLocationOpen(false);
            }
        }
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const handleAreaSelect = (area: Area) => {
        setArea(area);
        setLocationOpen(false);
        setMobileAreaSheet(false);
        onAreaSelect?.(area);
    };

    const userInitials = session?.user?.name
        ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "GU";

    return (
        <>
            <div className={`w-full border-b border-gray-100 ${variant === "store" ? "bg-white sticky top-0 z-40" : ""}`}>
                <div className="flex md:justify-between justify-center items-center w-full px-4 py-3 min-w-0 relative">
                    {/* Logo */}
                    <Link className="shrink-0" href="/">
                        <Image
                            alt="LootMart"
                            width={150}
                            height={73}
                            className="h-9 w-auto md:h-11"
                            src="https://www.lootmart.com.pk/_next/image?url=%2Flogo-header-300x147.png&w=384&q=75"
                            priority
                        />
                    </Link>

                    {/* Center section */}
                    <div className="hidden md:flex flex-1 justify-center min-w-0 mx-4">
                        {variant === "store" && storeName && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Now viewing</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-white text-xs" style={{ background: "#1a3a5c" }}>
                                    <Store className="w-3.5 h-3.5" />
                                    <span>{storeName}</span>
                                </span>
                                {sameDayDelivery && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Same day
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop right */}
                    <div className="hidden md:flex shrink-0 items-center gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            {/* Location dropdown */}
                            {variant === "home" && (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        className="select-trigger w-[200px] border-none bg-transparent hover:bg-gray-100"
                                        onClick={() => setLocationOpen(!locationOpen)}
                                    >
                                        <div className="flex items-center gap-2 text-left">
                                            <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-gray-500">Deliver to</span>
                                                <span className="text-sm font-medium truncate">
                                                    {selectedArea?.name || "Select area"}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    </button>
                                    {locationOpen && (
                                        <div className="select-dropdown">
                                            {areas.map((a) => (
                                                <div
                                                    key={a.id}
                                                    className="select-option"
                                                    onClick={() => handleAreaSelect(a)}
                                                >
                                                    <div className="font-medium text-sm">{a.name}</div>
                                                    <div className="text-xs text-gray-500">{a.city}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {variant === "store" && selectedArea && (
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Deliver to</span>
                                    <span className="text-sm font-medium text-gray-900">{selectedArea.name}</span>
                                </div>
                            )}

                            {variant === "store" && (
                                <>
                                    <div className="w-px h-8 bg-gray-200" />
                                    {/* Cart button (desktop) */}
                                    <button className="relative p-1.5" onClick={onCartToggle}>
                                        <ShoppingBag className="w-5 h-5 text-gray-700" />
                                        {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                                    </button>
                                </>
                            )}

                            {/* User */}
                            <div className="flex items-center">
                                <button
                                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                                    onClick={() => session ? signOut() : setShowLoginModal(true)}
                                >
                                    {session?.user?.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="h-8 w-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-500">{userInitials}</span>
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-700">
                                        {session?.user?.name?.split(" ")[0] || "Guest"}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile right */}
                    <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {variant === "store" && (
                            <button className="relative p-1.5" onClick={onCartToggle}>
                                <ShoppingBag className="w-5 h-5 text-gray-700" />
                                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                            </button>
                        )}
                        <button
                            className="flex items-center"
                            onClick={() => session ? signOut() : setShowLoginModal(true)}
                        >
                            {session?.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-500">{userInitials}</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile sub-nav (home only) */}
                {variant === "home" && (
                    <div className="md:hidden w-full border-t border-gray-100">
                        <div className="flex items-center justify-center gap-3 py-2 px-4">
                            <button
                                className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 transition-colors"
                                onClick={() => setMobileAreaSheet(true)}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="font-medium">{selectedArea?.name || "Select area"}</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            <span className="text-gray-300">&bull;</span>
                            <button className="flex items-center gap-1.5 text-xs hover:text-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Store className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-medium text-blue-900">Select store</span>
                                <ChevronDown className="w-3 h-3 text-blue-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="login-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Login to your account</h2>
                                <button onClick={() => setShowLoginModal(false)} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Login with your Google account</p>
                            <button
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4"
                                onClick={() => signIn("google")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Login with Google</span>
                            </button>
                            <p className="text-xs text-gray-400 text-center mb-4">
                                By continuing, you agree to our{" "}
                                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                            </p>
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-500 text-center">
                                    Don&apos;t have an account?{" "}
                                    <button onClick={() => signIn("google")} className="text-blue-600 font-medium hover:underline">
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 flex items-center justify-center">
                            <div className="text-center">
                                <Image
                                    src="https://www.lootmart.com.pk/_next/image?url=%2Flogo-header-300x147.png&w=384&q=75"
                                    alt="LootMart"
                                    width={150}
                                    height={73}
                                    className="h-12 mx-auto mb-2 opacity-60"
                                />
                                <p className="text-xs text-amber-700 opacity-60">Get loot from your nearby marts!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Area Sheet */}
            {mobileAreaSheet && (
                <div>
                    <div className="sheet-overlay" onClick={() => setMobileAreaSheet(false)} />
                    <div className="sheet-content">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Choose delivery area</h3>
                            <button onClick={() => setMobileAreaSheet(false)} className="p-1 rounded-md hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Select your location to see available stores</p>
                        <div className="space-y-2">
                            {areas.map((a) => (
                                <div key={a.id} className="area-card" onClick={() => handleAreaSelect(a)}>
                                    <div className="font-medium text-sm text-gray-900">{a.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{a.city}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
