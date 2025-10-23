import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/firestore',
        'sonner'
      ],
      // Force Vite to pre-bundle these modules
      esbuildOptions: {
        target: 'ES2020'
      }
    },
    build: {
      target: 'ES2020',
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
      // Ensure consistent output across environments
      emptyOutDir: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('react-router-dom')) return 'vendor-router';
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('radix-ui')) return 'vendor-radix';
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
