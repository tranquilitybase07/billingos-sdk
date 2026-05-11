# Contributing to @billingos/sdk

This guide walks you through setting up local development so you can work on the SDK and instantly see your changes reflected in a real Next.js app — no manual rebuilds, no cache clearing.

---

## How it works

The SDK is a separate repo from your app. To test changes locally you need to:

1. **Watch the SDK** — `tsup --watch` rebuilds `dist/` whenever you save a source file
2. **Link the SDK into your app** — instead of installing from npm, your app gets a real filesystem symlink to the SDK repo so it always reads the latest `dist/`
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

There are two ways. **Workspace overrides are recommended** because they're persistent in version control and don't pollute global pnpm state.

### Option A — `pnpm-workspace.yaml` overrides (recommended)

If your app already has a `pnpm-workspace.yaml`, add an `overrides` block. If it doesn't, create one in the project root:

```yaml
# pnpm-workspace.yaml
packages:
  - "."

overrides:
  "@billingos/sdk": link:../path/to/billingos-sdk
  "@billingos/node": link:../path/to/billingos-sdk/packages/node
```

Then reinstall:

```bash
pnpm install
```

> **Important — the override keys must be the *scoped* package names** (`@billingos/sdk`, `@billingos/node`), not the folder names (`billingos-sdk`, `node`). pnpm matches overrides by package name, not by directory. If the keys are wrong, the override silently does nothing and your app keeps the npm version.

**Example** — if your app sits at `~/Code/myapp/web` and the SDK at `~/Code/billingos-sdk`, the relative paths are:

```yaml
overrides:
  "@billingos/sdk": link:../../billingos-sdk
  "@billingos/node": link:../../billingos-sdk/packages/node
```

Verify the link took effect:

```bash
ls -la node_modules/@billingos/sdk
# should print: ... -> ../../../../billingos-sdk
```

### Option B — `pnpm link` (one-off / global)

Run from inside your **Next.js app's** directory:

```bash
pnpm link /path/to/billingos-sdk
pnpm link /path/to/billingos-sdk/packages/node   # only if you use @billingos/node
```

Use this when you don't want to edit your app's `pnpm-workspace.yaml` — for example, when poking at someone else's app for a one-time repro. It registers the link in pnpm's global store and won't survive a clean `pnpm install` unless you re-run `pnpm link` afterward.

> **Why not `file:` in `package.json`?**
>
> `file:` references *copy* the package into pnpm's content-addressed store at install time. That snapshot goes stale — even after `tsup` rebuilds, your app keeps loading the old copy until you `pnpm install --force`. Both `link:` (Option A) and `pnpm link` (Option B) create real filesystem symlinks, so your app always reads the latest build directly.

---

## Step 4 — Configure Next.js to watch the linked package

By default, Next.js only watches files inside its own project folder and ignores `node_modules` (even symlinked ones). You need to tell it to look further.

Open (or create) `next.config.ts` in your Next.js app:

**Next.js 15+ with Turbopack** (`next dev --turbopack` or Next.js 15+ default):

```ts
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['@billingos/sdk'],
  turbopack: {
    // Tell Turbopack to watch the parent folder so it can see
    // the symlinked SDK outside this project's directory.
    // Set this to a folder that contains BOTH your app and the SDK.
    root: path.join(__dirname, '..', '..'),
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

Edit any SDK source file → `tsup` rebuilds → Next.js hot-reloads. No manual steps.

---

## Troubleshooting

**Changes aren't showing up in the app**

1. Check the SDK terminal — confirm `tsup` printed a rebuild message after your save.
2. If yes, delete `.next` in your app and restart `pnpm dev`.
3. Verify the symlink: `ls -la node_modules/@billingos/sdk` should resolve to your SDK repo, **not** to `.pnpm/@billingos+sdk@<version>` (which means you're still on the npm copy).
4. If you're using `pnpm-workspace.yaml` overrides, double-check the override keys are the **scoped names** (`@billingos/sdk`, not `billingos-sdk`). Wrong keys silently no-op.
5. If you ever did `pnpm add @billingos/sdk@file:...`, that snapshots the build and won't pick up new changes — switch to one of the link approaches in Step 3.

**`Module not found: Can't resolve '@billingos/sdk'`**

You haven't linked the package yet, or the link broke after a reinstall. Re-run Step 3.

**Turbopack: "the project root is outside …"**

Your `turbopack.root` doesn't reach far enough. Set it to a directory that contains *both* your app and the SDK (e.g. `path.join(__dirname, '..', '..')` if both repos sit two levels above your app).

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
