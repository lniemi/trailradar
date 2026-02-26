import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
import basicSsl from '@vitejs/plugin-basic-ssl'
import trailsPlugin from './vite-plugin-trails'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cesium(), basicSsl(), trailsPlugin()],
  server: {
    host: '0.0.0.0', // allow access from network - useful for testing on mobile devices, but most likely to be used differently in production
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
    exclude: ['@trailradar/ui', '@trailradar/auth', '@trailradar/utils'],
  },
})
