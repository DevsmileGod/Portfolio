import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { seoShell } from "./vite/seoShell.ts";
import { BASE_PATH, CUSTOM_DOMAIN, PROFILE, SITE_URL } from "./src/data/profile.ts";

/**
 * The site is served from GitHub Pages: at /Portfolio/ on github.io, or at the root of CUSTOM_DOMAIN
 * (see src/data/profile.ts). Every build (CI, local `npm run build`, `npm run preview`) uses that base.
 * The dev server stays at the root for convenience.
 */
const PAGES_BASE = BASE_PATH;

/**
 * Build only: on a custom domain, writes the CNAME file GitHub Pages reads, and moves the 404 page's
 * redirect (written for /Portfolio/, which its tests check) to the domain's root.
 */
const customDomain = () => ({
  name: "custom-domain",
  apply: "build" as const,
  closeBundle() {
    if (!CUSTOM_DOMAIN) return;
    writeFileSync("dist/CNAME", `${CUSTOM_DOMAIN}\n`);
    const notFound = "dist/404.html";
    writeFileSync(notFound, readFileSync(notFound, "utf8").replaceAll("/Portfolio/", BASE_PATH));
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? PAGES_BASE : "/",
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 4173,
  },
  plugins: [
    react(),
    // index.html's %SITE_URL% placeholders come from src/data/profile.ts
    { name: "site-url", transformIndexHtml: (html: string) => html.replaceAll("%SITE_URL%", SITE_URL) },
    // Build only: a plain HTML copy of the content in #root, for crawlers and no-JS readers
    seoShell(),
    customDomain(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["images/favicon-64.webp", "apple-touch-icon.png"],
      // Install prompts fetch the manifest icons themselves; precaching them cost ~174 KB on every first visit
      includeManifestIcons: false,
      manifest: {
        name: `${PROFILE.name} | Software Engineer`,
        short_name: PROFILE.name,
        description: `${PROFILE.name}, Software Engineer and AI Engineer building production AI and the systems around it.`,
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Activate new deploys straight away instead of waiting for every tab to close
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Matched on the pathname so the routes work under any base and at the dev root alike
        runtimeCaching: [
          {
            // Self-hosted fonts carry a content hash, so a cached copy never goes stale
            urlPattern: ({ url }) => url.pathname.endsWith(".woff2"),
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images keep their names across deploys: serve the cached copy, refresh it in the background
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes("/images/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Preload each chunk's imports in parallel: the entry's vendors as <link rel="modulepreload"> in the
    // HTML, and a lazy section's shared chunks alongside it, instead of discovering them one hop at a time
    modulePreload: { polyfill: true },
    rolldownOptions: {
      output: {
        // Stable, cacheable vendor chunks. Groups match on node_modules paths (Rolldown has no object form).
        codeSplitting: {
          groups: [
            // Core React — always needed on first load
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 40 },
            // Router kept apart from react-dom: bundling them together once left react-dom undefined at startup
            { name: "router", test: /node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/, priority: 30 },
            {
              name: "framer-motion",
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 30,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 700,
    sourcemap: false,
  },
}));
