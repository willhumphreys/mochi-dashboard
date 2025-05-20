// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The key should exactly match the path you're using in fetch
      '/api/backtest': {
        target: 'https://6a3jgki3ul.execute-api.eu-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/prod')
      },
      // Proxy for S3 bucket to avoid CORS issues
      '/s3-proxy/mochi-prod-portfolio-tracking': {
        target: 'https://mochi-prod-portfolio-tracking.s3.eu-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-proxy\/mochi-prod-portfolio-tracking/, '')
      }
    }
  }
});
