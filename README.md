

### Rendering and routing
- App Router with nested segments.
- Dynamic routes for stores: `store/[slug]`.
- API routes in `app/api/**`.
- `generateStaticParams()` for store pre-generation.
- Segment-level ISR via `export const revalidate`.

### Caching and revalidation
- `unstable_cache()` for server-side cached data in [src/lib/cache.ts](src/lib/cache.ts).
- Cache tags (`products`, `stores`, `areas`) and tag/path revalidation in [src/app/actions.ts](src/app/actions.ts).
- HTTP cache headers on API routes (`s-maxage`, `stale-while-revalidate`).

### Data loading patterns
- Parallel server fetches with `Promise.all()`.
- Cursor pagination over API for product catalog.
- Infinite scroll using `IntersectionObserver` in [src/components/ProductGrid.tsx](src/components/ProductGrid.tsx).
- Optimistic UI updates with `useOptimistic()` for smoother incremental loading.
- Concurrent UI updates with `useTransition()`.

### Performance and UX
- Dynamic import/code splitting for page clients (`dynamic()` with loading fallback).
- Image optimization via `next/image`.
- Prefetching via `next/link` for store navigation.
- Debounced search input.

### SEO and metadata
- Route metadata and dynamic metadata (`generateMetadata`).
- OpenGraph/Twitter metadata.
- JSON-LD structured data for the homepage.

### State architecture
- Persisted client state with Zustand for area and cart.



