import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Lock port to 5173: Flywheel's CORS reflects this exact origin.
// strictPort makes Vite fail rather than silently pick a different port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
