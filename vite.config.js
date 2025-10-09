import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
  },

  // --- THIS IS THE NEW BLOCK TO ADD ---
  server: {
    proxy: {
      // This rule will match any request that starts with "/api"
      "/api": {
        // This is the address of your Quart backend server
        target: "http://localhost:8080",

        // This tells the proxy to change the origin of the host header
        // to the target URL, which is often required for virtual hosts.
        changeOrigin: true,

        // This is the crucial flag to enable WebSocket proxying
        ws: true,
      },
    },
  },
});
