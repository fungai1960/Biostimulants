import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './components'),
      '@/domain': path.resolve(__dirname, './domain'),
      '@/lib': path.resolve(__dirname, './lib'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['app/**/*.{ts,tsx}', 'domain/**/*.ts', 'lib/**/*.ts'],
    },
  },
});
