import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  // ADD THIS BUILD SECTION
  build: {
    outDir: "dist",
    sourcemap: true, // Helps debug errors in Cloudflare logs
  }
});
