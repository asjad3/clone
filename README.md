# LootMart Clone (Next.js 16)

This project is a functional and visual clone of lootmart.com.pk, implemented with the App Router and modern Next.js patterns.

## What was improved in this iteration

### Visual and UX alignment
- Added store welcome section + availability pill to match store-page structure.
- Added featured section action label (`Popular Picks`) like the reference flow.
- Added product toolbar controls:
	- category chips,
	- in-stock toggle,
	- sort selector,
	- grid/list view toggle.
- Added list-view layout styling for product cards.

### Functional fixes and upgrades
- Fixed API/client mismatch for product store filtering (`storeSlug` vs `store`).
- Fixed cursor logic to use offset-based pagination consistently.
- Added API sort handling (`relevance`, `price-asc`, `price-desc`, `name-asc`).
- Kept infinite scroll via `IntersectionObserver` and added manual `Load more` fallback.

## Advanced Next.js techniques used

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

## Run locally

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

## Notes on parity

This clone is now significantly closer in layout and behavior. For final pixel-level parity, run side-by-side screenshot QA on desktop/mobile across home, area modal, store listing, search/filter states, and cart states.
