"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, User, ChevronDown, Phone, LogIn } from "lucide-react";
import { areas } from "@/lib/data";

export default function Header() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Loot<span className="text-primary">Mart</span>
              </span>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="relative hidden sm:flex">
            <button
              onClick={() => setShowAreaDropdown(!showAreaDropdown)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="max-w-[140px] truncate">
                {selectedArea || "Select your area"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {showAreaDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-lg border border-border bg-white p-1 shadow-lg z-50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Islamabad / Rawalpindi
                </div>
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      setSelectedArea(area.name);
                      setShowAreaDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/5 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{area.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{area.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+923001234567"
              className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-4 w-4" />
              <span>Help</span>
            </a>

            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </button>
          </div>
        </div>

        {/* Mobile Location Bar */}
        <div className="flex sm:hidden items-center border-t px-4 py-2">
          <button
            onClick={() => setShowAreaDropdown(!showAreaDropdown)}
            className="flex flex-1 items-center gap-2 text-sm"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {selectedArea || "Select delivery area"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Welcome to LootMart</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter your phone number to continue</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background">
                  <span className="px-3 text-sm text-muted-foreground border-r">+92</span>
                  <input
                    type="tel"
                    placeholder="3XX XXXXXXX"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Send Verification Code
              </button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close area dropdown */}
      {showAreaDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAreaDropdown(false)}
        />
      )}
    </>
  );
}
