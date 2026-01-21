import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { mockApiPlugin } from './vite-mock-plugin'

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  resolve: {
    alias: {
      // Resolve SDK source directly for development
      '@billingos/sdk': path.resolve(__dirname, '../src'),
      '@': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
