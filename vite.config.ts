import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        configure(proxy) {
          proxy.on("proxyReq", (request, incoming) => {
            if (incoming.headers.origin === "http://127.0.0.1:5173")
              request.setHeader("origin", "http://127.0.0.1:3000");
          });
        },
      },
      "/uploads": "http://127.0.0.1:3000",
    },
    port: 5173,
    strictPort: true,
  },
});
