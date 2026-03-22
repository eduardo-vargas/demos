import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import macros from 'unplugin-parcel-macros';
import { cloudflare } from '@cloudflare/vite-plugin';

// Create a shared instance of the macros plugin
const macrosPlugin = macros.vite();

// Plugin to inject build info into window.build
function buildInfo() {
  return {
    name: 'build-info',
    closeBundle() {
      // Build timestamp is injected via index.html template
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: `window.build = { timestamp: new Date().toISOString() };`,
        },
      ];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Macros must run first before other plugins
    macrosPlugin,
    react(),
    cloudflare(),
    buildInfo(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8793',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: ['es2022'],
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        // Bundle all S2 and style-macro generated CSS into a single bundle instead of code splitting.
        manualChunks(id) {
          if (/macro-(.*)\.css$/.test(id) || /@react-spectrum\/s2\/.*\.css$/.test(id)) {
            return 's2-styles';
          }
        },
      },
    },
  },
});
