# Deployment Infrastructure & Strategy

## Overview

BillingOS SDK deployment follows a **phased approach** that balances rapid development (MVP) with production scalability. The infrastructure supports both native npm components and iframe-based embeds through dual distribution channels.

**Primary Use Case**: React/Next.js merchants install via `npm install @billingos/sdk`. The package includes:
- Native React components (pricing tables, dashboards)
- Iframe wrapper components (checkout modals, payment forms)
- API client for backend communication

**Secondary Use Case**: Non-React sites (WordPress, HTML) use optional CDN `<script>` tag. This is NOT the primary distribution method - npm is the main path.

## Deployment Phases

### Phase 1: MVP (Current → 3 months)
**Focus**: Rapid iteration, minimal infrastructure, jsDelivr CDN

### Phase 2: Production Scale (3-6 months)
**Focus**: Custom subdomain, monitoring, A/B testing

### Phase 3: Enterprise (6-12 months)
**Focus**: Multi-region, SLA guarantees, custom domains

## Infrastructure Architecture

### Phase 1: MVP Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  Merchants (React/Next.js Apps)                   │
│  npm install @billingos/sdk                                       │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ Install from npm
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      npm Registry                                 │
│  @billingos/sdk v1.0.0                                           │
│  ├── Native React Components                                     │
│  │   ├── <PricingTable />      (fully customizable)             │
│  │   ├── <UsageMeter />        (dashboard widgets)              │
│  │   └── <FeatureGate />       (logic only)                     │
│  │                                                               │
│  ├── Iframe Wrapper Components                                   │
│  │   ├── <CheckoutModal />     (creates iframe internally)      │
│  │   ├── <PaymentForm />       (creates iframe internally)      │
│  │   └── <CustomerPortal />    (creates iframe internally)      │
│  │                                                               │
│  └── API Client (BillingOSClient)                               │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ Iframe wrapper components create iframes pointing to:
             ▼
┌──────────────────────────────────────────────────────────────────┐
│              billingos.com/checkout/[id] (Vercel)                 │
│                                                                   │
│  Next.js App (apps/web) - Iframe Content:                        │
│  ├── /checkout/[productId]   → Checkout page in modal           │
│  ├── /portal/[customerId]    → Customer portal in modal         │
│  └── /payment-form           → Payment form in modal            │
│                                                                   │
│  (These pages load Stripe Elements, handle payment)              │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ API calls (Bearer token)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                 api.billingos.com (Vercel/Railway)                │
│  - NestJS Backend (apps/api)                                     │
│  - Authentication, Stripe integration                            │
│  - Database: Supabase PostgreSQL                                 │
└──────────────────────────────────────────────────────────────────┘

OPTIONAL (Non-React sites only):
┌──────────────────────────────────────────────────────────────────┐
│             jsDelivr CDN (for WordPress, HTML sites)              │
│  cdn.jsdelivr.net/npm/@billingos/checkout-embed/embed.global.js │
│  (Vanilla JS version - NOT the primary distribution)             │
└──────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Primary Distribution**: npm (React components + iframe wrappers)
- **Iframe Content Hosting**: Existing billingos.com Vercel deployment
- **Cost**: $0 (Vercel free tier, npm registry free)
- **Deployment Time**: 5-10 minutes
- **SSL**: Vercel (automatic)
- **Maintenance**: Low
- **CDN**: Optional jsDelivr for non-React sites only

**How It Works:**
1. Merchant runs `npm install @billingos/sdk`
2. Imports `<CheckoutModal />` component (React wrapper)
3. Component creates iframe pointing to `billingos.com/checkout/[id]`
4. User completes payment in iframe modal
5. Modal closes, user stays in merchant's app (no redirect)

### Phase 2: Production Scale Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Merchants                              │
└───────────┬──────────────────────────────────────┬──────────────┘
            │                                      │
            │ npm install                          │ CDN <script>
            ▼                                      ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│     npm Registry          │      │   embed.billingos.com     │
│  @billingos/sdk           │      │   (Vercel CDN)            │
│  - v1.2.3 (exact)         │      │  /v1/embed.js (stable)    │
│  - @latest (alias)        │      │  /v2/embed.js (next)      │
└───────────────────────────┘      │  /embed.abc123.js (hash)  │
            │                       └───────────────────────────┘
            │                                      │
            │                                      │ Loads iframe
            ▼                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              embed.billingos.com (Vercel Project)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Embed App (apps/embed)                          │   │
│  │  - /checkout/[id]             → Checkout iframe          │   │
│  │  - /portal/[customerId]       → Portal iframe            │   │
│  │  - /payment-form              → Payment form iframe      │   │
│  │  - /api/embed-script          → Versioned embed.js       │   │
│  │                                                           │   │
│  │  Headers: CSP, frame-ancestors, CORS                     │   │
│  │  Cache: 7-day for /v1/, immutable for hashed files       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │
            │ API calls
            ▼
┌─────────────────────────────────────────────────────────────────┐
│    billingos.com (Vercel) - Main Dashboard                       │
│    - Organization dashboard                                      │
│    - Settings, analytics, native pages                           │
└─────────────────────────────────────────────────────────────────┘
            │
            │ Backend API calls
            ▼
┌─────────────────────────────────────────────────────────────────┐
│            api.billingos.com (Production Backend)                │
│  - Load balanced (Vercel Edge or Railway)                        │
│  - Database: Supabase (Production tier)                          │
│  - Monitoring: Sentry, DataDog                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Cost**: ~$40/month (Vercel Pro + Supabase Pro)
- **Deployment**: Automated CI/CD (GitHub Actions)
- **Monitoring**: Error tracking, performance metrics
- **Versioning**: Multiple versions live simultaneously
- **Rollback**: Instant (change version alias)

### Phase 3: Enterprise Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Enterprise Merchants                        │
│  - Custom domains: checkout.merchant.com                         │
│  - Dedicated instances, SLA guarantees                           │
│  - Regional deployments (US, EU, APAC)                           │
└──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Multi-Region Edge Deployment                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  US (Vercel)   │  │  EU (Vercel)   │  │ APAC (Vercel)  │    │
│  │  Embed app     │  │  Embed app     │  │  Embed app     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│          │                   │                    │              │
│          └───────────────────┴────────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│                  ┌───────────────────────┐                       │
│                  │   Global Load         │                       │
│                  │   Balancer            │                       │
│                  │   (Vercel Edge)       │                       │
│                  └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Domain Strategy

### Phase 1: MVP Domains
```
billingos.com                  → Main dashboard
billingos.com/checkout/[id]    → Checkout iframe
billingos.com/portal/[id]      → Portal iframe
api.billingos.com              → Backend API
cdn.jsdelivr.net               → Embed script CDN (free)
```

### Phase 2: Production Domains
```
billingos.com                  → Main dashboard
embed.billingos.com            → All iframe content
embed.billingos.com/v1/embed.js → Versioned embed script
api.billingos.com              → Backend API
```

**DNS Configuration (Phase 2):**
```
Type    Name     Value                      TTL
CNAME   embed    cname.vercel-dns.com       300
CNAME   api      [railway/vercel-edge]      300
A       @        76.76.21.21 (Vercel)       300
```

### Phase 3: Enterprise Domains
```
embed.billingos.com                    → Default
embed-us.billingos.com                 → US region
embed-eu.billingos.com                 → EU region
embed-apac.billingos.com               → APAC region
checkout.merchant-domain.com           → Custom domain (enterprise)
```

## Build & Deployment Pipeline

### Monorepo Structure
```
billingos/
├── apps/
│   ├── web/              → Main dashboard (billingos.com)
│   ├── api/              → Backend (api.billingos.com)
│   └── embed/            → Embed app (embed.billingos.com) - Phase 2
├── packages/
│   ├── shared/           → Shared types
│   └── checkout-embed/   → Embeddable widget (npm + CDN)
└── .github/
    └── workflows/
        ├── deploy-sdk.yml       → npm publish
        └── deploy-embed.yml     → Vercel deploy
```

### Phase 1: Build Pipeline

**Package Build (checkout-embed):**
```bash
cd packages/checkout-embed
pnpm build          # tsup generates ESM, CJS, IIFE
pnpm test           # Run unit tests
npm publish         # Publish to npm → jsDelivr auto-hosts
```

**Manual Deployment:**
```bash
# Build native SDK
cd packages/checkout-embed
pnpm build
npm version patch
npm publish

# Deploy Next.js app (iframe pages)
cd apps/web
vercel --prod
```

### Phase 2: Automated CI/CD

**GitHub Actions: `.github/workflows/deploy-embed.yml`**
```yaml
name: Deploy Embed Widget

on:
  push:
    branches: [main]
    paths:
      - 'packages/checkout-embed/**'
      - 'apps/embed/**'

jobs:
  deploy-npm:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Build & Publish to npm
        run: |
          cd packages/checkout-embed
          pnpm install
          pnpm build
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Purge jsDelivr Cache
        run: |
          curl https://purge.jsdelivr.net/npm/@billingos/checkout-embed@latest

  deploy-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Embed App to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_EMBED_PROJECT_ID }}
          working-directory: apps/embed
          vercel-args: '--prod'

      - name: Verify Deployment
        run: |
          curl -f https://embed.billingos.com/health || exit 1
```

### Phase 3: Blue-Green Deployment

**Strategy:**
```
1. Deploy v2 to "green" environment
   → embed-green.billingos.com

2. Run automated tests against green
   → E2E tests, security scans

3. Route 10% traffic to green (canary)
   → Monitor error rates, performance

4. Gradually increase to 100%
   → 10% → 25% → 50% → 100%

5. Update version alias
   → /v2/embed.js points to green

6. Keep blue for 48 hours (rollback ready)
   → Instant rollback if issues detected
```

## Versioning & Caching Strategy

### npm Package Versioning
```
Semantic Versioning: MAJOR.MINOR.PATCH

Examples:
1.0.0 → Initial stable release
1.1.0 → New native component (backward compatible)
1.1.1 → Bug fix in native component
2.0.0 → Breaking change (API signature change)
```

### CDN Embed Script Versioning

**Phase 1 (jsDelivr):**
```
cdn.jsdelivr.net/npm/@billingos/checkout-embed@0.1/dist/embed.global.js
                                               ↑
                                      Version alias (7-day cache)

cdn.jsdelivr.net/npm/@billingos/checkout-embed@0.1.5/dist/embed.global.js
                                               ↑
                                      Exact version (1-year cache)
```

**Phase 2 (Custom Subdomain):**
```
embed.billingos.com/v1/embed.js              → Latest v1.x (7-day cache)
embed.billingos.com/v2/embed.js              → Latest v2.x (7-day cache)
embed.billingos.com/embed.a3b7c9.js          → Hashed (immutable, 1-year cache)
embed.billingos.com/1.2.3/embed.js           → Exact version (1-year cache)
```

### Cache Control Headers

**Versioned URLs (immutable):**
```http
Cache-Control: public, max-age=31536000, immutable
ETag: "a3b7c9def1"
```

**Version Aliases (/v1/):**
```http
Cache-Control: public, max-age=604800, stale-while-revalidate=86400
Vary: Accept-Encoding
```

**HTML Pages (iframe content):**
```http
Cache-Control: public, max-age=300, stale-while-revalidate=60
```

## Security Configuration

### Content Security Policy (CSP)

**Embed iframe pages (embed.billingos.com):**
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.billingos.com https://api.stripe.com;
  frame-ancestors 'self' https://*.vercel.app https://localhost:3000;
  img-src 'self' data: https:;
```

**Production: Restrict frame-ancestors to approved domains**
```http
frame-ancestors: https://approved-merchant1.com https://approved-merchant2.com;
```

### CORS Configuration

**Backend API (api.billingos.com):**
```typescript
// NestJS main.ts
app.enableCors({
  origin: [
    'https://billingos.com',
    'https://embed.billingos.com',
    /https:\/\/.*\.vercel\.app$/, // Preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-BillingOS-Version'],
})
```

### Embed Origin Validation

**Backend Guard:**
```typescript
// Validate embedding page origin
@Injectable()
export class EmbedOriginGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const embedOrigin = request.body.embed_origin

    if (!embedOrigin) return true

    // Check against approved domains for this merchant
    const approved = await this.db.query(
      `SELECT 1 FROM approved_embed_domains
       WHERE organization_id = $1 AND domain = $2`,
      [request.user.organizationId, embedOrigin]
    )

    if (!approved.rows.length) {
      throw new ForbiddenException('Embed origin not approved')
    }

    return true
  }
}
```

## Monitoring & Observability

### Phase 1: Basic Monitoring
- Vercel Analytics (built-in)
- npm download stats
- jsDelivr CDN stats (free)
- Error logs in Vercel dashboard

### Phase 2: Production Monitoring

**Error Tracking (Sentry):**
```typescript
// apps/embed/src/instrumentation.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Add embed context
    event.tags = {
      ...event.tags,
      component: 'embed-widget',
      embedOrigin: window.location.ancestorOrigins?.[0],
    }
    return event
  }
})
```

**Performance Monitoring:**
- Core Web Vitals (LCP, FID, CLS)
- Iframe load time
- API response times
- postMessage latency

**Business Metrics:**
- SDK version adoption (% on latest)
- Component usage (which components most used)
- Checkout conversion rates
- Error rates per version

### Phase 3: Enterprise Monitoring
- Custom dashboards (Grafana)
- SLA monitoring (99.9% uptime)
- Real-time alerts (PagerDuty)
- Regional performance metrics
- A/B test analytics

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

**npm Package:**
```bash
# Publish previous version with patch bump
npm version 1.2.4  # Was 1.2.5 (broken)
npm publish

# Or deprecate broken version
npm deprecate @billingos/sdk@1.2.5 "Critical bug - use 1.2.4"
```

**CDN Embed Script (Phase 2):**
```bash
# Option 1: Update version alias
# Manually update /v1/embed.js to point to previous build

# Option 2: Feature flag
# Toggle feature flag in dashboard to revert behavior

# Option 3: Vercel rollback
vercel rollback [deployment-url] --prod
```

### Gradual Rollback (Canary)
```
1. Detect issue (error rate spike)
2. Reduce traffic to new version
   100% → 50% → 25% → 10% → 0%
3. Investigate root cause
4. Fix and redeploy
```

## Cost Estimates

### Phase 1: MVP
```
Vercel (Hobby):              $0
Supabase (Free):             $0
jsDelivr CDN:                $0
npm Registry:                $0
Domain (billingos.com):      $12/year
─────────────────────────────────
Total: ~$1/month
```

### Phase 2: Production
```
Vercel Pro:                  $20/month
Supabase Pro:                $25/month
Domain + SSL:                $12/year
Sentry (Dev plan):           $26/month
GitHub Actions:              Free (2000 min/month)
─────────────────────────────────
Total: ~$72/month
```

### Phase 3: Enterprise
```
Vercel Enterprise:           $500+/month
Supabase Team:               $599/month
Multi-region:                +$200/month
Monitoring (DataDog):        $100+/month
PagerDuty:                   $21/user/month
─────────────────────────────────
Total: ~$1400+/month
```

## Migration Path

### Phase 1 → Phase 2 Transition

**Week 1-2: Setup**
- Create `apps/embed` Next.js project
- Set up Vercel project for embed.billingos.com
- Configure DNS for subdomain

**Week 3-4: Migration**
- Move iframe pages from apps/web to apps/embed
- Update embed script to point to new subdomain
- Deploy side-by-side (both domains work)

**Week 5-6: Cutover**
- Publish new npm version with updated URLs
- Merchants gradually upgrade
- Old domain (billingos.com/checkout) redirects to embed.billingos.com

**Week 7-8: Cleanup**
- Monitor adoption rate
- Deprecate old URLs
- Remove redirects after 90 days

## Best Practices

### Deployment Checklist
- [ ] Run full test suite (unit, integration, E2E)
- [ ] Update changelog and migration guide
- [ ] Bump version (semantic versioning)
- [ ] Build and test locally
- [ ] Deploy to staging/preview
- [ ] Manual QA on preview deployment
- [ ] Deploy to production
- [ ] Smoke test production
- [ ] Monitor error rates for 1 hour
- [ ] Announce release (changelog, email)

### Zero-Downtime Deployments
- Deploy new version to staging first
- Use Vercel preview deployments for testing
- Health check endpoints: `/api/health`
- Gradual traffic shifting (canary)
- Keep previous version running for rollback

### Disaster Recovery
- Database backups (daily via Supabase)
- Code in Git (source of truth)
- Vercel deployment history (instant rollback)
- Emergency contact list
- Runbook for common issues

## References

- **Vercel Multi-Domain**: https://vercel.com/docs/domains
- **jsDelivr CDN**: https://www.jsdelivr.com/documentation
- **Semantic Versioning**: https://semver.org/
- **Blue-Green Deployment**: https://martinfowler.com/bliki/BlueGreenDeployment/
- **CSP Guide**: https://content-security-policy.com/
- **Sentry Next.js**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
