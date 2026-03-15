# Ripplify Insights - Full Business Intelligence Guide

Capture every interaction and gain deep insights into user behavior. This guide covers installation for both vanilla HTML and React JS, including custom event tracking for advanced BI.

## 1. Installation

### Standard HTML
Add the snippet provided in your **Insights Setup** dashboard to the `<head>` of your website:

```html
<!-- Ripplify Insights snippet -->
```

*(Note: The snippet in your dashboard already contains your unique Project ID.)*

### React JS
For React applications, we recommend creating a simple wrapper or hook to handle the global state.

**Step 1: Add the script to your `index.html`** (same as above).

**Step 2: Use the Global API**
You can access `window.ripplify` anywhere in your React components.

```tsx
// Example: Tracking a purchase
const handlePurchase = (product) => {
  if (window.ripplify) {
    window.ripplify.track('Purchase', {
      amount: product.price,
      currency: 'USD',
      item: product.name
    });
  }
};
```

**Step 3: Recommended React Hook**
Create a `useRipplify.ts` hook for cleaner integration:

```tsx
import { useCallback } from 'react';

export const useRipplify = () => {
  const track = useCallback((name: string, properties?: any) => {
    if (window.ripplify) {
      window.ripplify.track(name, properties);
    } else {
      // Queue event if library isn't loaded yet
      window._ripplify_q = window._ripplify_q || [];
      window._ripplify_q.push(['track', name, properties]);
    }
  }, []);

  const identify = useCallback((userId: string, traits?: any) => {
    if (window.ripplify) {
      window.ripplify.identify(userId, traits);
    } else {
      window._ripplify_q = window._ripplify_q || [];
      window._ripplify_q.push(['identify', userId, traits]);
    }
  }, []);

  return { track, identify };
};
```

## 2. Business Intelligence (BI) Features

### Custom Event Tracking
Capture specific user actions that matter to your business (e.g., "Add to Cart", "Newsletter Signup", "Filter Used").

```javascript
ripplify.track('Feature Used', {
  feature_name: 'Search',
  query: 'Indigo Shoes'
});
```

### User Identification
Connect behavioral data to specific users to understand the full customer journey.

```javascript
ripplify.identify('user_12345', {
  email: 'customer@example.com',
  plan: 'Premium',
  total_spend: 450
});
```

### Rage Click Detection (Automatic)
Insights automatically detects when users click an element rapidly in frustration. These are flagged in your **Sessions** dashboard.

## 3. Data Ingestion Architecture
The `insight.js` library batches events and sends them every 5 seconds or when the user leaves the page to minimize performance impact on your site.

- **Batch Interval**: 5 seconds
- **Compression**: JSON stringified properties
- **Privacy**: Passwords and credit card inputs are never captured.
