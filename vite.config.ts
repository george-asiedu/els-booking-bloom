import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large third-party libs into their own cacheable chunks so the
        // main bundle stays lean and heavy libs (charts, PDF) load only where
        // they're actually used.
        manualChunks(id) {
          // Vite's preload helper is needed by the entry for every lazy route.
          // Unassigned, Rollup homes it with the first manual chunk that uses
          // it — jspdf, which code-splits internally — and the entry then
          // statically loads the whole ~540 kB PDF chunk just to reach it.
          if (id.includes("vite/preload-helper")) return "preload";
          if (!id.includes("node_modules")) return;
          // Same trap for small libraries the app and recharts both use: clsx
          // (behind cn()) otherwise lands in "charts", dragging ~400 kB of
          // charting code into the entry.
          if (/node_modules\/(clsx|tailwind-merge)\//.test(id)) return "ui-utils";
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          if (id.includes("html2canvas") || id.includes("jspdf")) return "pdf";
          if (id.includes("@paystack")) return "paystack";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack")) return "query";
        },
      },
    },
  },
}));
