import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Performance optimizations
  build: {
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Target modern browsers for smaller bundles
    target: 'esnext',
    
    // Enable minification
    minify: 'terser',
    
    // Optimize CSS
    cssMinify: true,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor libraries (rarely change)
          vendor: ['react', 'react-dom'],
          
          // Chart library (large dependency)
          charts: ['recharts'],
          
          // UI components (frequently used)
          ui: ['lucide-react'],
          
          // Heavy components (code split)
          'ai-insights': ['./src/components/sections/AIInsights'],
          'chat-features': [
            './src/components/sections/Enquire',
            './src/services/ChatService',
            './src/services/TranslationService'
          ],
          
          // Authentication (conditional loading)
          auth: [
            './src/contexts/AuthContext',
            './src/components/auth/AuthModal',
            './src/components/auth/BlockingAuthModal'
          ]
        },
        
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
  },
  
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime'
    ]
  },
  
  // Development server optimizations
  server: {
    hmr: {
      overlay: false // Reduce dev overhead
    }
  },
  
  // Preview server optimizations
  preview: {
    port: 4173,
    strictPort: true
  }
});