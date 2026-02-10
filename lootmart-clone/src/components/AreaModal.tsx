"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X, Search } from "lucide-react";
import { areas, stores } from "@/lib/data";

export default function AreaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user has already selected an area
    const savedArea = localStorage.getItem("lootmart_area");
    if (!savedArea) {
      setIsOpen(true);
    }
  }, []);

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAreaSelect = (areaId: number, areaName: string) => {
    localStorage.setItem("lootmart_area", JSON.stringify({ id: areaId, name: areaName }));
    
    // Find a store that serves this area
    const store = stores.find((s) => s.areas.includes(areaId));
    setIsOpen(false);
    
    if (store) {
      router.push(`/store/${store.slug}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select your area</h2>
              <p className="text-sm text-muted-foreground">To see stores & products near you</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Area Grid */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Islamabad / Rawalpindi
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => handleAreaSelect(area.id, area.name)}
                className="group flex flex-col items-start gap-1 rounded-xl border border-border p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{area.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{area.city}</span>
              </button>
            ))}
          </div>

          {filteredAreas.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No areas found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <p className="text-center text-xs text-muted-foreground">
            We&apos;re expanding to more areas soon! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
