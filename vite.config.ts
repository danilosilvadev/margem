import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vitest/config"
import { brand } from "./shared/brand.ts"

function siteBase(): string {
  const value = process.env.VITE_BASE_PATH
  if (!value || value === "/") return "/"
  const withLead = value.startsWith("/") ? value : `/${value}`
  return withLead.endsWith("/") ? withLead : `${withLead}/`
}

export default defineConfig(() => {
  const base = siteBase()
  const scope = base
  return {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: brand.name,
        short_name: brand.name,
        description: brand.description,
        theme_color: "#4d1925",
        background_color: "#f7f3ee",
        display: "standalone",
        start_url: base,
        scope,
        lang: "en",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      scope,
      workbox: {
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${base}__reachability`)],
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,json,ico}"],
        globIgnores: ["**/books/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/books/"),
            handler: "CacheFirst",
            options: { cacheName: "margem-books", expiration: { maxEntries: 40 } },
          },
        ],
      },
    }),
  ],
  server: { host: "127.0.0.1", port: 41731, strictPort: true },
  preview: { host: "127.0.0.1", port: 41731, strictPort: true },
  base,
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
  },
  }
})
