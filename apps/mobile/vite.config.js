import path from "node:path";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const rootDirectory = path.resolve(import.meta.dirname, "../..");
  const rootEnvironment = loadEnv(mode, rootDirectory, "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_TURNSTILE_SITE_KEY": JSON.stringify(
        rootEnvironment.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
      ),
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
    build: {
      sourcemap: true,
    },
  };
});
