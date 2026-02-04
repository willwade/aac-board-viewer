import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    conditions: ['browser'],
    alias: {
      'aac-board-viewer/vue': path.resolve(__dirname, '../src/vue/index.ts'),
      'aac-board-viewer/styles': path.resolve(__dirname, '../src/styles.css'),
      'aac-board-viewer': path.resolve(__dirname, '../src/index.ts'),
      stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
      events: path.resolve(__dirname, 'node_modules/events'),
      timers: path.resolve(__dirname, 'node_modules/timers-browserify'),
      util: path.resolve(__dirname, 'node_modules/util'),
      path: path.resolve(__dirname, 'node_modules/path-browserify'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3002,
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '4174', 10),
    allowedHosts: true,
  },
});
