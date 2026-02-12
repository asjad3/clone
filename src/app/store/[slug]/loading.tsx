export default function StoreLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header skeleton */}
            <div className="w-full border-b border-gray-100 bg-white">
                <div className="flex justify-between items-center w-full px-4 py-3">
                    <div className="skeleton h-9 w-36" />
                    <div className="hidden md:flex items-center gap-4">
                        <div className="skeleton h-6 w-48" />
                        <div className="skeleton h-8 w-8 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Info bar skeleton */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="skeleton h-16 w-48 rounded-lg" />
                        <div className="skeleton h-16 w-48 rounded-lg" />
                        <div className="skeleton h-16 w-64 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Search skeleton */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="skeleton h-5 w-64 mb-3" />
                <div className="skeleton h-12 w-full rounded-xl mb-4" />
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton h-8 w-20 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Products skeleton */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="product-card">
                            <div className="img-wrap">
                                <div className="skeleton absolute inset-3" />
                            </div>
                            <div className="info">
                                <div className="skeleton h-3 w-16 mb-2" />
                                <div className="skeleton h-4 w-full mb-1" />
                                <div className="skeleton h-3 w-12 mb-2" />
                                <div className="skeleton h-8 w-full mt-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
