import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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
    define: {
      'import.meta.env.VITE_WEB_APP_URL': JSON.stringify(env.VITE_WEB_APP_URL)
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true
    },
    base: '/'
  }
})
