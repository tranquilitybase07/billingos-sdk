# Contributing to @billingos/sdk

This guide walks you through setting up local development so you can work on the SDK and instantly see your changes reflected in a real Next.js app — no manual rebuilds, no cache clearing.

---

## How it works

The SDK is a separate repo from your app. To test changes locally you need to:

1. **Watch the SDK** — a build tool (tsup) watches your source files and rebuilds `dist/` whenever you save
2. **Link the SDK into your app** — instead of installing from npm, your app gets a live symlink that always points at the latest build
3. **Tell Next.js to watch outside its own folder** — by default Next.js ignores files outside the project directory, including symlinked packages

---

## Step 1 — Clone and install the SDK

```bash
git clone https://github.com/billingos/sdk.git billingos-sdk
cd billingos-sdk
pnpm install
```

---

## Step 2 — Start the watch server

Open a terminal in the SDK repo and start the watcher. It rebuilds automatically every time you save a file.

```bash
# If you're only changing the React SDK (most common)
pnpm dev

# If you're also changing the Node SDK (server-side)
pnpm dev:all
```

You'll see output like `dist/index.mjs built in 300ms` — that means it's working. Keep this terminal open.

> **What's the difference between the two packages?**
> - `@billingos/sdk` — React components and hooks used in the browser
> - `@billingos/node` — Server-side SDK for API routes / backend code
> - `pnpm dev` watches only the React SDK; `pnpm dev:all` watches both

---

## Step 3 — Link the SDK into your Next.js app

Run these commands from inside your **Next.js app's** directory. Adjust the path to match where you cloned the SDK.

```bash
# Link the React SDK
pnpm link /path/to/billingos-sdk

# Link the Node SDK (only needed if your app uses @billingos/node in API routes)
pnpm link /path/to/billingos-sdk/packages/node
```

**Example** — if both repos sit side-by-side in the same folder:

```
~/Code/
  billingos-sdk/       ← SDK repo
  my-nextjs-app/       ← your app
```

```bash
cd ~/Code/my-nextjs-app
pnpm link ../billingos-sdk
pnpm link ../billingos-sdk/packages/node
```

> **Why `pnpm link` and not `file:` in package.json?**
>
> `file:` references copy the package into pnpm's internal cache at install time. That snapshot goes stale — even after tsup rebuilds, your app keeps loading the old copy. `pnpm link` creates a real filesystem symlink, so your app always reads the latest build directly. No reinstall needed.

---

## Step 4 — Configure Next.js to watch the linked package

By default, Next.js only watches files inside its own project folder and ignores `node_modules` (even symlinked ones). You need to tell it to look further.

Open (or create) `next.config.ts` in your Next.js app:

**Next.js 15+ with Turbopack** (`next dev --turbopack` or Next.js 15 default):

```ts
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['@billingos/sdk'],
  turbopack: {
    // Tell Turbopack to watch the parent folder so it can see
    // the symlinked SDK outside this project's directory.
    // Set this to the folder that contains BOTH your app and the SDK.
    root: path.join(__dirname, '..'),
  },
}

export default nextConfig
```

**Next.js 14 or earlier (Webpack)**:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@billingos/sdk'],
  webpack(config) {
    config.watchOptions = {
      ...config.watchOptions,
      followSymlinks: true,
    }
    config.snapshot = {
      ...config.snapshot,
      unmanagedPaths: [/node_modules\/@billingos/],
    }
    return config
  },
}

export default nextConfig
```

---

## Step 5 — Start your Next.js app

```bash
# Delete any stale Next.js cache first (important after first-time link setup)
rm -rf .next

pnpm dev
```

---

## You're done — full workflow from here

Once setup is complete, your daily workflow is just two terminals:

| Terminal | Command | What it does |
|---|---|---|
| 1 (SDK repo) | `pnpm dev` | Rebuilds `dist/` on every save |
| 2 (Next.js app) | `pnpm dev` | Hot-reloads when `dist/` changes |

Edit any SDK source file → tsup rebuilds → Next.js hot-reloads. No manual steps.

---

## Troubleshooting

**Changes aren't showing up in the app**

1. Check the SDK terminal — confirm tsup printed a rebuild message after your save
2. If yes, delete `.next` in your app and restart `pnpm dev`
3. Make sure you used `pnpm link` (not `pnpm add @billingos/sdk@file:...`) — the `file:` approach snapshots the build and won't pick up new changes

**`Module not found: Can't resolve '@billingos/sdk'`**

You haven't linked the package yet. Run `pnpm link /path/to/billingos-sdk` from inside your Next.js app directory (Step 3 above).

**Peer dependency warnings from pnpm**

Warnings like `unmet peer @stripe/react-stripe-js` are harmless during local development. The SDK declares minimum compatible versions; newer versions work fine.

---

## Other useful commands

```bash
# One-shot build (no watching)
pnpm build

# Build both React SDK + Node SDK
pnpm prepare

# Type checking
pnpm type-check

# Linting (zero warnings policy)
pnpm lint

# Node SDK tests
pnpm --filter @billingos/node test
pnpm --filter @billingos/node test:watch
```
