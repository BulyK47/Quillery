import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// One source, three targets (web / browser-extension side panel / Electron).
// All three load from a relative base so the built assets resolve under
// chrome-extension://, file:// (Electron) and plain http(s):// alike.
const target = process.env.BUILD_TARGET ?? "web";

// Inject a restrictive CSP into the built index.html only. We don't put it in
// index.html directly because Vite's dev server injects an inline React-refresh
// script that a strict script-src would block. The production bundle has no
// inline scripts, so script-src 'self' is safe there (Electron + extension).
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self' data:; connect-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'none'";

function cspPlugin(): Plugin {
  return {
    name: "inject-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), cspPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: target !== "extension",
    target: "es2020",
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
