import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@billingos/sdk': path.resolve(__dirname, '../src'),
      '@': path.resolve(__dirname, '../src'),
    },
  },
  define: {
    __BILLINGOS_CSS__: '""',
  },
})
