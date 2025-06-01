import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";

// Load env vars based on mode
export default defineConfig(({ mode }) => {
  // Load .env or .env.production as appropriate
  const envFile = mode === "production" ? ".env.production" : ".env";
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  // Set API base URL
  const DEV_API_BASE_URL = "http://localhost:3001";
  const PROD_API_BASE_URL = process.env.VITE_API_BASE_URL;

  const apiBaseUrl = mode === "development" ? DEV_API_BASE_URL : PROD_API_BASE_URL;

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
