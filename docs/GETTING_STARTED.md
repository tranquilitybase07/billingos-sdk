# Getting Started - BillingOS SDK Development

## 🎯 Goal

Build 4 React components with dummy data:
1. **PricingTable** - Subscription plans grid
2. **PaymentBottomSheet** - Stripe payment widget
3. **CustomerPortal** - Subscription management dashboard
4. **UpgradeNudge** - Proactive upgrade prompts

## 📋 Prerequisites

- Node.js 18+
- Basic React knowledge
- Familiarity with TypeScript
- Understanding of Tailwind CSS

## 🚀 Quick Setup

### 1. Initialize Project

```bash
cd /Users/ankushkumar/Code/billingos-sdk

# Initialize package.json if not exists
npm init -y

# Install dependencies
npm install react react-dom @stripe/stripe-js @stripe/react-stripe-js axios @tanstack/react-query framer-motion

# Install dev dependencies
npm install -D \
  typescript \
  @types/react \
  @types/react-dom \
  vite \
  @vitejs/plugin-react \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

### 2. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Configure Vite

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 4. Configure Tailwind

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./examples/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

### 5. Create Project Structure

```bash
mkdir -p src/{components,hooks,providers,client,types,utils}
mkdir -p examples/demo-app
```

## 📁 Final Structure

```
billingos-sdk/
├── docs/
│   ├── GETTING_STARTED.md          ← You are here
│   ├── authentication-flow.md       ← Read this for auth
│   ├── api-integration.md           ← Backend API specs
│   └── component-specs/
│       ├── pricing-table-spec.md    ← START HERE
│       ├── payment-bottom-sheet-spec.md
│       ├── customer-portal-spec.md
│       └── upgrade-nudge-spec.md
├── src/
│   ├── components/
│   │   ├── PricingTable.tsx        ← Build 1st
│   │   ├── PaymentBottomSheet.tsx  ← Build 3rd
│   │   ├── CustomerPortal.tsx      ← Build 4th
│   │   ├── UpgradeNudge.tsx        ← Build 2nd
│   │   └── ui/                      ← Shared components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Drawer.tsx
│   ├── client/
│   │   ├── BillingOSClient.ts      ← API client (later)
│   │   └── types.ts                 ← TypeScript types
│   ├── hooks/
│   │   ├── useBillingOS.ts
│   │   ├── useProducts.ts
│   │   ├── useSubscription.ts
│   │   └── useCheckout.ts
│   ├── providers/
│   │   └── BillingOSProvider.tsx   ← Context provider
│   ├── types/
│   │   └── index.ts                 ← Shared types
│   └── index.ts                     ← Main export
├── examples/
│   └── demo-app/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 Step 1: Build First Component (PricingTable)

### Create Dummy Data File

`src/data/dummy.ts`:

```typescript
export const DUMMY_PRODUCTS = {
  products: [
    {
      id: "prod_starter",
      name: "Starter",
      description: "Perfect for small teams",
      prices: [
        {
          id: "price_starter_monthly",
          amount: 2900,
          currency: "usd",
          interval: "month",
          intervalCount: 1
        }
      ],
      features: [
        { title: "1,000 API calls/month", type: "usage_quota" },
        { title: "Up to 5 projects", type: "numeric_limit" },
        { title: "Email support", type: "boolean_flag" }
      ],
      isCurrentPlan: false,
      trialDays: 14
    },
    {
      id: "prod_pro",
      name: "Professional",
      description: "For growing businesses",
      prices: [
        {
          id: "price_pro_monthly",
          amount: 9900,
          currency: "usd",
          interval: "month",
          intervalCount: 1
        }
      ],
      features: [
        { title: "10,000 API calls/month", type: "usage_quota" },
        { title: "Up to 50 projects", type: "numeric_limit" },
        { title: "Priority support (24h)", type: "boolean_flag" },
        { title: "Advanced analytics", type: "boolean_flag" }
      ],
      isCurrentPlan: true,
      trialDays: 14
    },
    {
      id: "prod_enterprise",
      name: "Enterprise",
      description: "For large organizations",
      prices: [
        {
          id: "price_enterprise_monthly",
          amount: 29900,
          currency: "usd",
          interval: "month",
          intervalCount: 1
        }
      ],
      features: [
        { title: "Unlimited API calls", type: "usage_quota" },
        { title: "Unlimited projects", type: "numeric_limit" },
        { title: "Dedicated account manager", type: "boolean_flag" },
        { title: "99.9% SLA guarantee", type: "boolean_flag" }
      ],
      isCurrentPlan: false,
      trialDays: 0
    }
  ]
};
```

### Create PricingTable Component

`src/components/PricingTable.tsx`:

```tsx
import React from 'react';
import { DUMMY_PRODUCTS } from '../data/dummy';

export function PricingTable() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Start with a 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DUMMY_PRODUCTS.products.map(product => (
          <div
            key={product.id}
            className={`relative rounded-2xl border-2 p-8 ${
              product.isCurrentPlan
                ? 'border-primary-600 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {product.isCurrentPlan && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Current Plan
              </div>
            )}

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h3>
              <p className="mt-2 text-gray-600">
                {product.description}
              </p>

              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">
                  ${(product.prices[0].amount / 100).toFixed(0)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <svg
                    className="h-6 w-6 text-primary-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="ml-3 text-gray-700">{feature.title}</span>
                </li>
              ))}
            </ul>

            <button
              className={`mt-8 w-full py-3 px-6 rounded-lg font-medium ${
                product.isCurrentPlan
                  ? 'bg-gray-100 text-gray-700 cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              disabled={product.isCurrentPlan}
            >
              {product.isCurrentPlan ? 'Current Plan' : 'Buy Now'}
            </button>

            {product.trialDays > 0 && !product.isCurrentPlan && (
              <p className="mt-4 text-center text-sm text-gray-500">
                {product.trialDays}-day free trial
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Create Demo App

`examples/demo-app/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`examples/demo-app/App.tsx`:

```tsx
import React from 'react'
import { PricingTable } from '../../src/components/PricingTable'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-4">
          BillingOS SDK Demo
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Testing components with dummy data
        </p>

        <PricingTable />
      </div>
    </div>
  )
}

export default App
```

`examples/demo-app/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`examples/demo-app/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BillingOS SDK Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

### Update package.json

Add scripts:

```json
{
  "scripts": {
    "dev": "vite examples/demo-app",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## ▶️ Run Demo

```bash
npm run dev
```

Open http://localhost:5173

You should see the pricing table with 3 plans!

## ✅ Checkpoint 1 Complete

You now have:
- ✅ Project set up with TypeScript, Vite, Tailwind
- ✅ PricingTable component with dummy data
- ✅ Demo app running locally
- ✅ Beautiful pricing grid displaying

## 📝 Next Steps

### Option A: Continue with Components (Recommended)

1. Build UpgradeNudge next (simpler)
   - Read `docs/component-specs/upgrade-nudge-spec.md`
   - Use dummy nudge trigger data
   - Add to demo app

2. Build PaymentBottomSheet
   - Read `docs/component-specs/payment-bottom-sheet-spec.md`
   - Create shell (no Stripe yet)
   - Wire up to PricingTable "Buy Now" button

3. Build CustomerPortal
   - Read `docs/component-specs/customer-portal-spec.md`
   - Build tab navigation
   - Add subscription, invoices, payment methods tabs

### Option B: Connect to Real API

If backend is ready:

1. Create API client
   - Read `docs/api-integration.md`
   - Build `src/client/BillingOSClient.ts`

2. Create React Query hooks
   - `src/hooks/useProducts.ts`
   - Wrap PricingTable with real data

3. Add authentication
   - Read `docs/authentication-flow.md`
   - Create `BillingOSProvider`
   - Handle customer tokens

## 📚 Documentation Reference

When building each component, follow this pattern:

1. **Read the spec** (`docs/component-specs/[component]-spec.md`)
2. **Copy dummy data** (provided in spec)
3. **Build UI** (use Tailwind, match mockup)
4. **Add to demo app** (test visually)
5. **Move to next component**

## 🎨 UI Component Library (Optional)

You can create reusable UI components:

`src/components/ui/Button.tsx`:

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors';

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 🐛 Troubleshooting

### Tailwind not working?

Make sure you imported the CSS:

```tsx
// examples/demo-app/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Module not found?

Check `tsconfig.json` path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite not starting?

Delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 🎯 Success Criteria

After Week 1, you should have:

- ✅ All 4 components built with dummy data
- ✅ Demo app showing all components
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Beautiful UI matching specs
- ✅ TypeScript with no errors
- ✅ Ready to connect to real API

## 🚀 You're All Set!

**Start here:**
1. Run `npm run dev`
2. See PricingTable in browser
3. Read `docs/component-specs/upgrade-nudge-spec.md`
4. Build UpgradeNudge next

Happy coding! 🎉
