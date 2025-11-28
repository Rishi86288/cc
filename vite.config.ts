import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL FIX: Use relative base path
  base: "./", 
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  }
});
```

### **Step 2: Update `index.html` (Script Source)**

Your `index.html` currently uses an absolute path (`/src/main.tsx`). While Vite handles this in dev, it's safer to use a relative path for the build process to pick it up correctly with the new base setting.

**Action:** Open `index.html` and change the script tag:

**From:**
```html
<script type="module" src="/src/main.tsx"></script>
```

**To:**
```html
<script type="module" src="./src/main.tsx"></script>
