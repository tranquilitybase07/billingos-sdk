# Clerk Auth Setup (Simplest Pattern)

**Pattern:** No Route File - Fully Automatic
**Files:** 2 files + 1 modified
**Code:** ~30 lines
**Magic Level:** ⭐⭐⭐⭐⭐

---

## Installation

```bash
npm install @clerk/nextjs
```

---

## Setup Files

### File 1: `.env.local`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Where to get keys:** https://dashboard.clerk.com

---

### File 2: `middleware.ts`

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
```

**What this does:**
- Intercepts all requests
- Checks auth status
- Makes user data available
- **Auto-creates ALL auth routes** (no route file needed!)

---

### Modified: `app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## Usage Examples

### Pre-built UI Components

```typescript
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

### Get Current User (Server)

```typescript
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <div>Hello {user.firstName}</div>;
}
```

### Get Current User (Client)

```typescript
'use client';
import { useUser } from '@clerk/nextjs';

export function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return <div>Hello {user.firstName}</div>;
}
```

### Protect Routes

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <div>Protected content</div>;
}
```

---

## The Magic Explained

### What Clerk Auto-Creates

Clerk automatically handles these routes (you never create them):

- `/api/auth/sign-in`
- `/api/auth/sign-out`
- `/api/auth/callback`
- `/api/auth/session`
- `/api/auth/user`

**How?** The middleware intercepts requests and Clerk's internal SDK handles routing.

### Why This Works

1. **Middleware runs first** - Before any route handlers
2. **Clerk SDK is smart** - Recognizes auth-related paths
3. **Auto-routing** - Generates responses without your route files
4. **Session management** - Handles cookies/JWTs automatically

---

## Pros & Cons

### Pros ✅

- **Simplest setup** - Only 2 files
- **Zero route files** - Completely automatic
- **Pre-built UI** - Sign-in, sign-up, user button components
- **Works immediately** - No manual auth logic
- **Best DX** - Just works out of the box

### Cons ❌

- **Less control** - Can't customize auth internals easily
- **Vendor lock-in** - Tied to Clerk's APIs
- **Paid service** - Free tier limited, costs for scale
- **Black box** - Magic can be hard to debug

---

## When to Use Clerk Pattern

✅ **Use if:**
- You want the simplest possible setup
- You're okay with managed auth service
- You want pre-built UI components
- You value speed over customization

❌ **Don't use if:**
- You need full control over auth
- You want to self-host auth
- You have custom auth requirements
- You're building open-source (vendor dependency)

---

## For BillingOS SDK

**Learnings:**
- Middleware-based auto-routing is powerful
- Zero route files = best DX
- Pre-built components reduce implementation time
- Trade-off: Magic vs Control

**Application:**
- Consider middleware-based billing route handling
- Provide pre-built components (pricing table, portal)
- Balance magic (auto-config) with flexibility (custom handlers)
