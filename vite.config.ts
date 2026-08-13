import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/auth': {
        // diver_auth's compose port. 8081 was Keycloak's, and nothing has
        // listened there since it was retired — the proxy failed with a 500.
        target: 'http://localhost:3201',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/auth/, ''),
      },
    },
  },
})
