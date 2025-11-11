import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    lib: {
      entry: "card/barcode-card.ts",
      name: "BarcodeCard",
      fileName: "barcode-card",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        entryFileNames: "barcode-card.js",
      },
    },
  },
  test: {
    environment: "jsdom",
    env: {
      TZ: "Etc/UTC",
      IS_TEST: "true",
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
    watch: false,
  },
});
