import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 8080, host: true },
  preview: { port: 8080, host: true },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
