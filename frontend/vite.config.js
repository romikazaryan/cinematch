import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services')
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: ['https://cinematch-7mj1c4710-romiks-projects-f2369c35.vercel.app'], // Добавляем разрешенный хост
  }
})
