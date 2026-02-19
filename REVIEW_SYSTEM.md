# Progressive Review Popup System

A non-intrusive, multi-step review system for collecting feedback on orders, inspired by UberEats and Foodpanda.

## 🎯 Features

### Progressive Steps
1. **Rider Review (Priority)** - Most important, collected first
2. **Store Review** - Overall store experience
3. **Product Reviews** - Individual product ratings

### Smart Comment Collection
- Low ratings (≤2 stars) **require** comments
- High ratings (>2 stars) have **optional** comments
- Ensures quality feedback for poor experiences

### User Experience
- ✅ Visual progress bar showing current step
- ✅ Skip/dismiss option ("Maybe later")
- ✅ Smooth animations and transitions
- ✅ Mobile-responsive design
- ✅ Completion confirmation screen
- ✅ Star rating with hover effects

## 📁 File Structure

```
src/
├── components/
│   ├── ReviewPopup.tsx       # Main progressive review component
│   ├── ReviewDemo.tsx        # Demo page for testing
│   └── CartSidebar.tsx       # Integrated with checkout flow
├── types/
│   └── index.ts              # Order, Rider, Review types
├── store/
│   └── cart.ts               # State management with Zustand
├── lib/
│   └── demoOrder.ts          # Demo order generator
└── app/
    └── globals.css           # Review popup styles
```

## 🚀 Usage

### In Real Application

The review popup automatically appears 2 seconds after checkout:

```tsx
import { useCartStore } from "@/store/cart";
import ReviewPopup from "@/components/ReviewPopup";

function MyComponent() {
  const { pendingReviewOrder, setPendingReviewOrder } = useCartStore();

  const handleReviewSubmit = (reviews) => {
    // Send to your backend API
    fetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviews)
    });
  };

  return (
    <>
      {/* Your app content */}
      
      {pendingReviewOrder && (
        <ReviewPopup
          order={pendingReviewOrder}
          isOpen={true}
          onClose={() => setPendingReviewOrder(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
}
```

### Testing with Demo

To test the review system independently:

```tsx
import ReviewDemo from "@/components/ReviewDemo";

// Use this component to preview and test the review flow
<ReviewDemo />
```

## 🎨 Design Principles

### Non-Intrusive
- Can be dismissed at any step
- Appears only after order delivery
- Progress indicator shows completion status

### Data Quality
- Required comments for low ratings ensure actionable feedback
- Star ratings provide quick quantitative data
- Optional comments for positive experiences

### Mobile-First
- Bottom sheet on mobile devices
- Centered modal on desktop
- Touch-friendly star ratings
- Optimized for thumb zones

## 📊 Data Structure

### Review Submission Format

```typescript
{
  rider: {
    orderId: "order_123",
    riderId: 1,
    rating: 5,
    comment: "Great service!"
  },
  store: {
    orderId: "order_123",
    storeId: 1,
    rating: 4,
    comment: undefined  // optional
  },
  products: [
    {
      orderId: "order_123",
      productId: 1,
      rating: 5,
      comment: undefined
    },
    {
      orderId: "order_123",
      productId: 2,
      rating: 2,
      comment: "Product was damaged"  // required for low rating
    }
  ]
}
```

## 🎭 Demo Riders

The system includes 3 demo riders with realistic profiles:

1. **Ahmed Khan** - Motorcycle rider
2. **Hassan Ali** - Motorcycle rider
3. **Bilal Raza** - Bike rider

Each has a randomized avatar and contact information.

## 🔄 Flow Diagram

```
Order Placed
    ↓
Checkout
    ↓
Cart Cleared
    ↓
2 Second Delay
    ↓
Review Popup Opens
    ↓
┌─────────────────┐
│  Rider Review   │ ← PRIORITY (Step 1)
│  ⭐⭐⭐⭐⭐      │
│  [Comment Box]  │ ← Required if ≤2 stars
└─────────────────┘
    ↓ Continue
┌─────────────────┐
│  Store Review   │ (Step 2)
│  ⭐⭐⭐⭐⭐      │
│  [Comment Box]  │
└─────────────────┘
    ↓ Continue
┌─────────────────┐
│Product Reviews  │ (Step 3)
│  • Product 1    │
│  • Product 2    │
└─────────────────┘
    ↓ Submit
┌─────────────────┐
│  Thank You!     │ ✓
│  Reviews Sent   │
└─────────────────┘
```

## 🎯 Key Implementation Details

### State Management

Uses Zustand for persistent cart state and temporary review state:

```typescript
interface CartState {
  items: Record<number, CartItem>;
  pendingReviewOrder: Order | null;  // Triggers review popup
  setPendingReviewOrder: (order: Order | null) => void;
  // ... other cart methods
}
```

### Animations

All animations defined in `globals.css`:

- `fadeIn` - Overlay appearance
- `scaleIn` - Popup entrance
- `slideDown` - Comment box reveal
- `slideInFade` - Step transitions

### Responsive Behavior

- **Desktop**: Centered modal with fixed width
- **Mobile**: Bottom sheet anchored to screen bottom
- **Both**: Smooth transitions and touch-friendly controls

## 🧪 Testing

1. Add items to cart on any store page
2. Click "Proceed to Checkout"
3. Wait 2 seconds
4. Review popup appears
5. Complete the progressive flow

Or use the `ReviewDemo` component for isolated testing.

## 🎨 Customization

### Colors

Main accent color: `#E5A528` (Yellow)
- Primary buttons
- Progress bar
- Star ratings

Can be customized in the component and CSS.

### Timing

Popup delay after checkout:
```typescript
setTimeout(() => {
  setPendingReviewOrder(demoOrder);
}, 2000); // 2 seconds - adjust as needed
```

### Required Comment Threshold

Currently set at ≤2 stars. Change in `ReviewPopup.tsx`:

```typescript
if (riderRating <= 2 && !riderComment.trim()) {
  // Change the threshold here
}
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔮 Future Enhancements

- [ ] Photo upload for reviews
- [ ] Pre-filled review suggestions
- [ ] Review history page
- [ ] Incentives for completing reviews (loyalty points)
- [ ] Review moderation system
- [ ] Analytics dashboard for review insights

## 📄 License

Part of the LootMart project.
