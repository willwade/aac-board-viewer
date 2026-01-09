import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aacApiPlugin } from './server/api-plugin';
import path from 'path';

export default defineConfig({
  plugins: [react(), aacApiPlugin()],
  resolve: {
    conditions: ['browser'],
    alias: {
      '@willwade/aac-processors': '@willwade/aac-processors/browser',
      // Polyfills for xml2js
      stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
      events: path.resolve(__dirname, 'node_modules/events'),
      timers: path.resolve(__dirname, 'node_modules/timers-browserify'),
      util: path.resolve(__dirname, 'node_modules/util'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3001,
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '4173', 10),
    // Allow running behind App Platform/other hosts without hard-coding the domain
    allowedHosts: true,
  },
});
