import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

/**
 * Pre-processes src/styles/globals.css through PostCSS (with Tailwind v4)
 * and returns the resulting CSS as a JSON-safe string literal so it can be
 * inlined via esbuild's `define` mechanism.
 *
 * The value is consumed by src/styles/inject.ts which uses the `__BILLINGOS_CSS__`
 * placeholder — esbuild replaces it at bundle time with this string.
 */
async function buildCSSDefine(): Promise<string> {
  const { default: postcss } = await import('postcss')
  const { default: tailwindcss } = await import('@tailwindcss/postcss')

  const raw = readFileSync('./src/styles/globals.css', 'utf8')
  const result = await postcss([tailwindcss()]).process(raw, {
    from: './src/styles/globals.css',
  })
  // Return as a JSON string literal so esbuild inlines it correctly.
  return JSON.stringify(result.css)
}

export default defineConfig(async () => {
  const cssDefine = await buildCSSDefine()

  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    /**
     * Match existing dist file naming so package.json exports don't need updating:
     *   ESM  → dist/index.mjs
     *   CJS  → dist/index.js
     */
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' }
    },
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    clean: true,
    /**
     * Externalize everything that should come from the consumer's environment.
     * Peer dependencies are never bundled; heavy optional deps are also external.
     */
    external: [
      'react',
      'react-dom',
      '@stripe/react-stripe-js',
      '@stripe/stripe-js',
      '@tanstack/react-query',
      'react-shadow-scope',
      'react-hook-form',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'zod',
    ],
    esbuildOptions(options) {
      /**
       * "use client" must be the very first token in the ESM bundle.
       * Next.js App Router (Turbopack) uses this directive to determine RSC vs
       * client module resolution for peer deps like @tanstack/react-query.
       */
      options.banner = { js: '"use client";' }

      /** Resolve the @ path alias used throughout the source tree. */
      options.alias = { '@': './src' }

      /**
       * Replace the __BILLINGOS_CSS__ placeholder in src/styles/inject.ts
       * with the Tailwind-processed CSS string at bundle time.
       */
      options.define = { __BILLINGOS_CSS__: cssDefine }
    },
  }
})
