"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function StoreError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Only log the safe digest in production, not the full error stack
        if (process.env.NODE_ENV === "development") {
            console.error("Store page error:", error);
        } else if (error.digest) {
            console.error("Store page error digest:", error.digest);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-sm text-gray-500 mb-6">
                    We couldn&apos;t load this store. This might be a temporary issue.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                        style={{ background: "#E5A528" }}
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Go home
                    </Link>
                </div>
                {error.digest && (
                    <p className="text-xs text-gray-400 mt-4">Error ID: {error.digest}</p>
                )}
            </div>
        </div>
    );
}
