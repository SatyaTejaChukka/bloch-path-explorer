import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables including non-VITE_ ones like BACKEND_API
  const env = loadEnv(mode, process.cwd(), '')
  const backendApi = env.BACKEND_API || env.VITE_BACKEND_API || env.VITE_API_URL || ''

  return {
    plugins: [react()],
    define: {
      __BACKEND_API__: JSON.stringify(backendApi)
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            'react-three': ['@react-three/fiber', '@react-three/drei'],
            recharts: ['recharts']
          }
        }
      }
    }
  }
})
