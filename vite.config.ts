import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,

        // Remove /api prefix before forwarding to backend
        rewrite: (path) => path.replace(/^\/api/, ""),

        // Optional: log proxy activity (useful for debugging)
        // configure: (proxy) => {
        //   proxy.on("proxyReq", (proxyReq, req) => {
        //     console.log("Proxying:", req.method, req.url);
        //   });
        // },
      },
    },
  },
});

