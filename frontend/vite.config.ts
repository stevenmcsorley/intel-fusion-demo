import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@intel-fusion/shared': path.resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 5173,
    host: true, // Allow external connections (for Docker)
    watch: {
      usePolling: true // Better for Docker environments
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    global: 'globalThis'
  }
})