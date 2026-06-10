import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages so asset URLs resolve under the repo sub-path.
  base: '/Ashtrom-QR-APP/',
})
