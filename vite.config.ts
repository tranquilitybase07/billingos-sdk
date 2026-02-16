import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(), // This injects CSS directly into JS bundle
    dts({
      include: ['src'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BillingOS',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      plugins: [
        peerDepsExternal() as any,  // This automatically externalizes all peer dependencies
      ],
      external: [
        // Still explicitly externalize runtime dependencies that aren't peer deps
        'react-shadow-scope',
        'react-hook-form',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'date-fns',
        'zod',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@stripe/stripe-js': 'StripeJS',
          '@stripe/react-stripe-js': 'ReactStripeJS',
          '@tanstack/react-query': 'ReactQuery',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
