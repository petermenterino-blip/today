/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { reticle } from '@reticlehq/core/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      logLevel: 'error',
      server: {
        port: 3000,
        host: true,
        strictPort: true,
        hmr: true,
        allowedHosts: ["all"],
      },
      plugins: [
        react(),
        tailwindcss(),
        reticle(),
      ],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      },
      build: {
        outDir: 'dist',
        reportCompressedSize: false,
        chunkSizeWarningLimit: 2000,
        cssCodeSplit: true,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('lucide-react') || id.includes('recharts') || id.includes('motion')) {
                  return 'vendor-ui';
                }
                if (id.includes('@sentry') || id.includes('hls.js') || id.includes('jspdf') || id.includes('xlsx')) {
                  return 'vendor-heavy';
                }
                if (id.includes('@tanstack') || id.includes('@supabase')) {
                  return 'vendor-data';
                }
                return 'vendor';
              }
              if (id.includes('src/features/mentor/') || id.includes('src/features/messaging/') || id.includes('src/features/resources/') || id.includes('src/features/admin/')) {
                return 'feature-heavy';
              }
            }
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html', 'lcov'],
          include: ['src/**/*.{ts,tsx}'],
          exclude: ['src/**/*.d.ts', 'src/test/**', 'src/vite-env.d.ts'],

        },
      },
    };
});
