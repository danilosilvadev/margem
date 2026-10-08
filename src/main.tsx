import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/playfair-display/wght.css"
import "@fontsource-variable/playfair-display/wght-italic.css"
import "@fontsource-variable/dm-sans/wght.css"
import { registerSW } from "virtual:pwa-register"
import { App } from "./App"
import "./index.css"

function restorePagesPath() {
  const saved = new URLSearchParams(location.search).get("p")
  if (!saved || !saved.startsWith("/") || saved.startsWith("//") || saved.includes("://")) return
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "")
  const next = `${base}${saved}`
  if (next !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, "", next)
}

restorePagesPath()

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
