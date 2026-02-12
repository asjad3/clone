import Link from "next/link";
import { Store, Home } from "lucide-react";

export default function StoreNotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Store not found</h2>
                <p className="text-sm text-gray-500 mb-6">
                    The store you&apos;re looking for doesn&apos;t exist or may have been removed.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ background: "#E5A528" }}
                >
                    <Home className="w-4 h-4" />
                    Browse all stores
                </Link>
            </div>
        </div>
    );
}
