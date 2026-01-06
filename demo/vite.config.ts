import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aacApiPlugin } from './server/api-plugin';

export default defineConfig({
  plugins: [react(), aacApiPlugin()],
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
