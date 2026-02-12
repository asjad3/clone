"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    storeName: string;
    onSearch: (query: string) => void;
}

const popularSearches = ["Bread", "Eggs", "Milk", "Tea", "Cookies", "Chocolate", "Cooking Oil", "Chicken"];

export default function SearchBar({ storeName, onSearch }: SearchBarProps) {
    const [value, setValue] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleChange = useCallback(
        (val: string) => {
            setValue(val);
            // Debounced search - 200ms delay
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onSearch(val.trim());
            }, 200);
        },
        [onSearch]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleTagClick = (tag: string) => {
        setValue(tag);
        onSearch(tag);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
                Find products quickly in <span>{storeName}</span>
            </h2>
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                    type="text"
                    className="flex-1 border-none outline-none bg-transparent text-sm"
                    placeholder={`Search products in ${storeName}...`}
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Popular searches:</span>
                {popularSearches.map((tag) => (
                    <button key={tag} className="search-tag" onClick={() => handleTagClick(tag)}>
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}
