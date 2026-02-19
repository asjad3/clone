# Quick Reference: Review System

## 🚀 Quick Start

### Test the System

1. **Go to any store page** (e.g., `/store/al-fatah-gujranwala`)
2. **Add items to cart**
3. **Click "Proceed to Checkout"**
4. **Wait 2 seconds** → Review popup appears!

### How It Works

```
Checkout → Clear Cart → 2s delay → Review Popup Opens
```

## 📱 Progressive Steps

### Step 1: Rider Review ⭐
- **Priority**: Highest (delivery experience)
- **Required**: Star rating
- **Comment**: Required if ≤2 stars

### Step 2: Store Review 🏪
- **Priority**: Second
- **Required**: Star rating
- **Comment**: Required if ≤2 stars

### Step 3: Product Reviews 📦
- **Priority**: Third
- **Required**: Nothing (can skip all)
- **Comment**: Required if ≤2 stars per product

### Step 4: Complete ✅
- Thank you screen
- Reviews submitted to console

## 🎨 Key Files

| File | Purpose |
|------|---------|
| `ReviewPopup.tsx` | Main component (440 lines) |
| `ReviewDemo.tsx` | Standalone demo |
| `demoOrder.ts` | Generates demo orders |
| `cart.ts` | State management |
| `CartSidebar.tsx` | Integration point |
| `globals.css` | Styles & animations |
| `types/index.ts` | TypeScript types |

## 💻 Code Snippets

### Trigger Review Manually
```tsx
import { useCartStore } from "@/store/cart";

const { setPendingReviewOrder } = useCartStore();
setPendingReviewOrder(myOrder);
```

### Handle Review Submission
```tsx
const handleReviewSubmit = (reviews) => {
  console.log(reviews);
  // Send to API: POST /api/reviews
};
```

### Create Demo Order
```tsx
import { generateDemoOrder } from "@/lib/demoOrder";

const order = generateDemoOrder(store, items, subtotal, delivery, total);
```

## 🎯 Props

### ReviewPopup Component
```tsx
<ReviewPopup
  order={order}        // Order object (required)
  isOpen={boolean}     // Control visibility
  onClose={() => {}}   // Close handler
  onSubmit={(data) => {}} // Review submission
/>
```

## 📊 Data Format

### Input: Order
```typescript
{
  id: string,
  orderNumber: string,
  items: CartItem[],
  store: Store,
  rider: Rider,
  total: number
}
```

### Output: Reviews
```typescript
{
  rider: { orderId, riderId, rating, comment? },
  store: { orderId, storeId, rating, comment? },
  products: [
    { orderId, productId, rating, comment? }
  ]
}
```

## 🎨 Customization

### Change Colors
Find in `ReviewPopup.tsx`:
```tsx
bg-yellow-400  →  bg-your-color
text-yellow-400 → text-your-color
```

### Change Delay
Find in `CartSidebar.tsx`:
```tsx
setTimeout(() => {
  setPendingReviewOrder(demoOrder);
}, 2000); // ← Change this (milliseconds)
```

### Change Comment Requirement
Find in `ReviewPopup.tsx`:
```tsx
if (riderRating <= 2 && !riderComment.trim()) {
  // Change threshold: 2 → your value
}
```

## 🐛 Debugging

### Check State
```tsx
const { pendingReviewOrder } = useCartStore();
console.log('Pending review:', pendingReviewOrder);
```

### Review Data
Check browser console after submitting - all review data is logged.

### Demo Mode
Use `<ReviewDemo />` component to test without checkout flow.

## ✨ Features Checklist

- [x] Progressive 3-step flow
- [x] Rider priority
- [x] Required low-rating comments
- [x] Optional high-rating comments
- [x] Visual progress bar
- [x] Skip/dismiss option
- [x] Mobile responsive
- [x] Smooth animations
- [x] Star hover effects
- [x] Back navigation
- [x] Completion screen
- [x] Demo data support

## 📱 Responsive Breakpoints

- **Desktop**: Centered modal, max-width 500px
- **Mobile**: Bottom sheet, full width, 90vh max-height

## 🔗 Related Files

- Documentation: `REVIEW_SYSTEM.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`
- Types: `src/types/index.ts`
- Store: `src/store/cart.ts`

---

**Need Help?** Check the full documentation in `REVIEW_SYSTEM.md`
