import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'card/barcode-card.ts',
      name: 'BarcodeCard',
      fileName: 'barcode-card',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'barcode-card.js'
      }
    },
    minify: 'esbuild'
  },
  test: {
    ...configDefaults,
    watch: false
  }
});
