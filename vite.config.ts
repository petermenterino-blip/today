import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
        hmr: false,
        allowedHosts: ["all"],
      },
      plugins: [
        react(),
        tailwindcss()
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
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('lucide-react') || id.includes('recharts') || id.includes('motion')) {
                  return 'vendor-ui';
                }
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
