# BillingOS Agent-Friendly SDK Strategy — Implementation Plan

## Summary of Decisions Made

| Decision | Answer |
|----------|--------|
| Primary strategy | Agent tooling (MCP server + custom skill.md) |
| Target users | Both developers integrating BillingOS AND billing admins |
| Target agents | All (Claude Code, Cursor, Windsurf, etc.) via MCP |
| Dev-facing tools | Read-only context injection (code snippets, API specs) — handled by Mintlify MCP + custom skill.md |
| Admin-facing tools | Read-only lookups via custom MCP server (customers, subscriptions, products) |
| V2 plan | Write operations with agent confirmation prompts |
| Package name | `@billingos/mcp` at `packages/mcp/`, version 0.1.0 |
| Auth | `BILLINGOS_SECRET_KEY` + `BILLINGOS_API_URL` env vars |
| MCP SDK | Official `@modelcontextprotocol/sdk` |
| Transport | stdio + streamable HTTP |
| Build tool | tsup (matching Node SDK) |
| Agent rules files | skill.md is enough (no project-level rules files needed) |
| Registry listing | Yes — Cursor Directory, OpenTools, mcp.run, etc. |

---

## Phase 0: Prerequisite — Extend `@billingos/node`

The Node SDK currently lacks list/search/product methods the MCP server needs. Add these to `packages/node/src/client/billingos.ts`:

| Method | Endpoint | Notes |
|--------|----------|-------|
| `listCustomers(params?)` | `GET /customers` | Pagination params |
| `searchCustomers(query, params?)` | `GET /customers/search?q=` | Search by email/name |
| `listSubscriptions(params?)` | `GET /subscriptions` | Filter by customerId, status |
| `listProducts(params?)` | `GET /v1/products` | Pagination |
| `getProduct(productId)` | `GET /v1/products/:id` | Product details with features |
| `getCustomerEntitlements(customerId)` | `GET /v1/usage/check?customer_id=` | All entitlements |

Also add `Product` types to `packages/node/src/types/index.ts`.

---

## Phase 1: `@billingos/mcp` Package

### File Structure

```
packages/mcp/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts              # Entry: env vars → BillingOS client → start server
│   ├── server.ts             # MCP server setup, tool registration, routing
│   ├── tools/
│   │   ├── customers.ts      # 5 tools: list, get, search, entitlements, usage
│   │   ├── subscriptions.ts  # 2 tools: list, get
│   │   └── products.ts       # 2 tools: list, get
│   └── utils/
│       └── errors.ts         # BillingOSError → MCP error response formatter
├── tests/
│   └── tools.test.ts
└── README.md
```

### V1 MCP Tools (9 total, all read-only)

**Customer Operations:**
- `list_customers` — List customers with pagination
- `get_customer` — Get customer details by ID
- `search_customers` — Search by email/name
- `get_customer_entitlements` — View all entitlements for a customer
- `get_customer_usage` — View usage metrics for a customer

**Subscription Operations:**
- `list_subscriptions` — List with filters (customer_id, status)
- `get_subscription` — Get subscription details by ID

**Product/Plan Catalog:**
- `list_products` — List products with pricing info
- `get_product` — Get product details with features/entitlements

### Architecture

1. **Entry point** (`index.ts`): Reads env vars, validates `sk_*` key, creates `BillingOS` client from `@billingos/node`, starts MCP server with both stdio and streamable HTTP transports
2. **Server** (`server.ts`): Creates `Server` instance, registers tools via `ListToolsRequestSchema` and `CallToolRequestSchema`, routes calls to tool handlers
3. **Tool handlers** (`tools/*.ts`): Each exports tool definitions (JSON Schema) and handler functions. Handlers call `BillingOS` client methods and return JSON as text content
4. **Error handling** (`utils/errors.ts`): Catches `BillingOSError` subclasses, returns `{ isError: true }` with structured error JSON. Never throws from tool handlers

### Key Dependencies

```json
{
  "dependencies": {
    "@billingos/node": "workspace:*",
    "@modelcontextprotocol/sdk": "^latest"
  }
}
```

### User Configuration

**Claude Code** (`.claude/settings.json` or project MCP config):
```json
{
  "mcpServers": {
    "billingos": {
      "command": "npx",
      "args": ["@billingos/mcp"],
      "env": {
        "BILLINGOS_SECRET_KEY": "sk_test_...",
        "BILLINGOS_API_URL": "https://api.billingos.dev"
      }
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "billingos": {
      "command": "npx",
      "args": ["@billingos/mcp"],
      "env": {
        "BILLINGOS_SECRET_KEY": "sk_test_...",
        "BILLINGOS_API_URL": "https://api.billingos.dev"
      }
    }
  }
}
```

---

## Phase 2: Custom `skill.md`

Override Mintlify's auto-generated skill.md. Place at repo root `/skill.md` (Mintlify serves it at `/.well-known/skills/default/skill.md`).

### Structure (agentskills.io spec, ~250-300 lines)

```yaml
---
name: billingos
display_name: BillingOS SDK
description: Add billing, subscriptions, feature gating, and customer portals to web apps
tags: [billing, subscriptions, payments, saas, react, nextjs, stripe]
version: "1.0"
packages:
  - "@billingos/node"
  - "@billingos/sdk"
---
```

### Content Sections

1. **Overview** (~10 lines) — What BillingOS is, two SDKs, architecture pattern
2. **Setup** (~40 lines) — Install, env vars, session token API route, Provider wrapper
3. **Feature Gating** (~50 lines) — useCheckEntitlement, FeatureGate, UpgradeNudge, server-side checks
4. **Full Billing Portal** (~50 lines) — PricingTable → CheckoutModal → CustomerPortal flow
5. **Node SDK Operations** (~40 lines) — Customers, subscriptions, usage tracking
6. **Constraints & Gotchas** (~20 lines) — Token expiry, peer deps, cents-based amounts, Shadow DOM
7. **Common Patterns** (~40 lines) — "Add billing to Next.js app", "Gate a feature", "Track usage"

### Prerequisite: Evaluate Mintlify Output First

Before writing the custom skill.md:
1. Fetch `https://docs.billingos.dev/llms.txt` and `https://docs.billingos.dev/skill.md`
2. Test: connect an agent to the Mintlify MCP at `https://docs.billingos.dev/mcp`
3. Evaluate: Does it cover both SDKs? Session token flow? Components? Under 5000 tokens?
4. Adjust custom skill.md to compensate for specific gaps

---

## Phase 3: Registry Listing & Distribution

After v1 is stable:
1. Publish `@billingos/mcp` to npm
2. List on MCP registries: Cursor Directory, mcp.run, OpenTools, Windsurf.run
3. Add setup instructions to BillingOS docs (new "AI Agents" section)
4. Update root `prepare` script to include MCP package build

---

## Implementation Sequence

| Step | Task | Depends On |
|------|------|-----------|
| 1 | Add list/search/product methods to `@billingos/node` | — |
| 2 | Add Product types to Node SDK types | — |
| 3 | Scaffold `packages/mcp/` (package.json, tsconfig, tsup) | — |
| 4 | Implement MCP entry point (`index.ts`) | 1, 3 |
| 5 | Implement MCP server (`server.ts`) | 4 |
| 6 | Implement customer tools | 1, 5 |
| 7 | Implement subscription tools | 1, 5 |
| 8 | Implement product tools | 1, 2, 5 |
| 9 | Implement error formatting utility | 5 |
| 10 | Write unit tests | 6, 7, 8 |
| 11 | Update root package.json prepare script | 3 |
| 12 | Evaluate Mintlify auto-generated output | — (parallel) |
| 13 | Write custom `skill.md` | 12 |
| 14 | Integration test with MCP Inspector + Claude Desktop | 6, 7, 8 |

---

## V2 Roadmap (Future)

Write operations with confirmation:
- `create_customer` — Create a new customer
- `update_customer` — Update customer details
- `create_subscription` — Create a subscription
- `cancel_subscription` — Cancel a subscription
- `update_subscription` — Change plan/price
- `track_usage` — Record a usage event

All write tools should include a `confirmation` field in the response asking the agent to confirm the action with the user before executing.
