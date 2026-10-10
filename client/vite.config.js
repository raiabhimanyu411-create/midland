import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          i18n: ['i18next', 'react-i18next']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
      '/robots.txt': 'http://localhost:5001',
      '/sitemap.xml': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001'
    }
  }
});
