import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function normalizeBasePath(value) {
  const candidate = String(value || "/").trim();

  if (!candidate || candidate === "/") {
    return "/";
  }

  const leading = candidate.startsWith("/")
    ? candidate
    : `/${candidate}`;

  return leading.endsWith("/")
    ? leading
    : `${leading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    appType: "spa",
    base: normalizeBasePath(env.VITE_PUBLIC_BASE_PATH),
    plugins: [react()],
    server: {
      host: "localhost",
      port: 5173,
      strictPort: false,
      open: true
    },
    preview: {
      host: "localhost",
      port: 4173,
      strictPort: false,
      open: true
    },
    build: {
      target: "es2022",
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,
      sourcemap: false
    }
  };
});
