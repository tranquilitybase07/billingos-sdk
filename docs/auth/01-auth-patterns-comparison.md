# Authentication Patterns Comparison

**Date:** January 24, 2025
**Research:** Clerk, Kinde, Better Auth, Useautumn

---

## Quick Comparison Table

| Tool | Files to Create | Total Code | Env Vars | Pattern | Magic Level |
|------|----------------|------------|----------|---------|-------------|
| **Clerk** | 2 | ~30 lines | 2 | No route file needed | ⭐⭐⭐⭐⭐ |
| **Useautumn** | 2 | ~30 lines | 0* | `[...all]` catch-all | ⭐⭐⭐⭐ |
| **Kinde** | 4 | ~60 lines | 6 | `[kindeAuth]` | ⭐⭐⭐ |
| **Better Auth** | 4 | ~50 lines | 2+ | `[...all]` + migrations | ⭐⭐ |

*Useautumn: Env vars configured via dashboard UI, not code

---

## Pattern Analysis

### Pattern 1: "No Route File" (Clerk)
**Zero auth route files** - Clerk handles everything internally via middleware.

**Setup:**
```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();

// layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
<ClerkProvider>{children}</ClerkProvider>
```

**Magic:** Clerk auto-creates ALL auth routes (`/api/auth/*`) - developer never touches route files.

**Best for:** Maximum simplicity, "just works" experience

---

### Pattern 2: "Catch-All Route" (Useautumn, Better Auth)
**Single file** handles multiple endpoints via `[...all]` dynamic route.

**Setup:**
```typescript
// app/api/auth/[...all]/route.ts
export const { GET, POST } = authHandler({
  identify: async (req) => ({ userId: 'user_123' })
});
```

**Magic:** One file handles `/api/auth/sign-in`, `/api/auth/sign-out`, `/api/auth/callback`, etc.

**Best for:** Clean DX, one file to manage, flexible auth integration

---

### Pattern 3: "Dashboard Config" (Useautumn)
**Zero env vars in code** - everything configured via web UI.

**What's in dashboard:**
- Product definitions
- Pricing tiers
- Feature flags
- Usage limits
- API keys

**Best for:** Non-technical team members can change config, no code deploys for pricing changes

---

### Pattern 4: "Provider + Handler" (All billing tools)
**Separation**: Server instance + Client provider + Route handler

**Files:**
- `lib/auth.ts` - Server configuration
- `lib/auth-client.ts` - Client instance
- `app/api/auth/[...all]/route.ts` - HTTP handler
- `app/layout.tsx` - Provider wrapper

**Best for:** Type safety, testability, clear boundaries

---

## Key Insights: Reducing Developer Effort

### What Makes Setup "Easy"?

1. **Fewer files to create** (2 vs 4 files)
2. **Less boilerplate code** (30 lines vs 60 lines)
3. **Auto-routing magic** (no manual route files)
4. **Minimal env vars** (2 vs 6 variables)
5. **No manual database steps** (avoid migrations)
6. **Single provider wrapper** (one component, not multiple)

### Best Practices Identified

1. ✅ Use catch-all routes (`[...all]`) to handle multiple endpoints in one file
2. ✅ Export handler directly from SDK instead of writing custom logic
3. ✅ Provide both server + client instances for type safety
4. ✅ Use middleware for protection instead of manual guards
5. ✅ Default to permissive (all routes public) and opt-in to protection
6. ✅ Pre-built UI components reduce custom code

---

## The "Perfect Setup" Would Be

```typescript
// 1. Install
npm install perfect-auth

// 2. .env.local
PERFECT_AUTH_KEY=xxx

// 3. middleware.ts (ONE LINE!)
export { authMiddleware as default } from 'perfect-auth/next';

// 4. layout.tsx (wrap app)
import { AuthProvider } from 'perfect-auth/react';
export default ({ children }) => <AuthProvider>{children}</AuthProvider>;

// 5. Use anywhere
import { useAuth } from 'perfect-auth/react';
const { user, signIn, signOut } = useAuth();
```

**Total:** 2 files, ~15 lines of code, zero config files, zero migrations.

---

## Sources

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Better Auth Installation](https://www.better-auth.com/docs/installation)
- [Kinde Next.js SDK](https://docs.kinde.com/developer-tools/sdks/backend/nextjs-sdk/)
- [Useautumn GitHub](https://github.com/useautumn/autumn)
