import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      // Include drei's nested dependencies to prevent optimization issues
      '@react-three/drei > three-stdlib',
      '@react-three/drei > @monogrid/gainmap-js',
      '@react-three/drei > troika-three-text',
      'mapbox-gl',
      'geo-three',
    ],
    exclude: ['@sportradar/ui', '@sportradar/auth', '@sportradar/utils'],
  },
})
