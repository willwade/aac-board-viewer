import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aacApiPlugin } from './server/api-plugin';

export default defineConfig({
  plugins: [react(), aacApiPlugin()],
  server: {
    port: 3001,
  },
});
