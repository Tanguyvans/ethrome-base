import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: ['@xmtp/wasm-bindings', '@xmtp/browser-sdk'],
    include: ['@xmtp/proto'],
  },
  worker: {
    format: 'es',
  },
})
