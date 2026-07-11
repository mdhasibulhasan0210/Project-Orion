import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      hmr:   process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase split into sub-packages
            'firebase-app':       ['firebase/app'],
            'firebase-auth':      ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
            'firebase-storage':   ['firebase/storage'],
            'firebase-functions': ['firebase/functions'],
            // React core
            'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
            // React Query
            'query-vendor':  ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
