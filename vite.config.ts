import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", 
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // CRITICAL FIX: Externalize Firebase modules so Rollup doesn't try to bundle the massive SDK
    rollupOptions: {
        external: [
            /^firebase\/.*/, // Exclude all firebase subpackages
          
        ]
    }
  }
});
