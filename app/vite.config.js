import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ai-active-suspection-2/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.4.1',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://192.168.4.1',
        ws: true
      }
    }
  }
});
