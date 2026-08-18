import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const required = [
    'VITE_API_URL',
    'VITE_API_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  const missing = required.filter(name => !env[name] || /^(replace-|https:\/\/your-|your-)/.test(env[name]));
  if (missing.length > 0) {
    throw new Error('Missing tenant configuration: ' + missing.join(', ') + '. Run the bootstrap script or create an ignored environment file.');
  }

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    modulePreload: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            const packagePath = id.split('node_modules/')[1];
            const packageName = packagePath?.startsWith('@')
              ? packagePath.split('/').slice(0, 2).join('/').replace('@', '').replace('/', '-')
              : packagePath?.split('/')[0];

            if (id.includes('@react-three') || id.includes('three')) {
              return 'three-vendor';
            }

            if (id.includes('recharts')) {
              return 'chart-vendor';
            }

            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }

            if (id.includes('@azure/msal')) {
              return 'msal-vendor';
            }

            if (id.includes('react-markdown') || id.includes('@uiw/react-md-editor')) {
              return 'markdown-vendor';
            }

            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }

            return 'vendor';
          }
        },
      },
    },
  },
  };
});
