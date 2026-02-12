"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Area } from "@/types";

interface AreaState {
    selectedArea: Area | null;
    setArea: (area: Area) => void;
    clearArea: () => void;
}

export const useAreaStore = create<AreaState>()(
    persist(
        (set) => ({
            selectedArea: null,
            setArea: (area: Area) => set({ selectedArea: area }),
            clearArea: () => set({ selectedArea: null }),
        }),
        {
            name: "lootmart-area",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
