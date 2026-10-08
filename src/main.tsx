import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/playfair-display/wght.css"
import "@fontsource-variable/playfair-display/wght-italic.css"
import "@fontsource-variable/dm-sans/wght.css"
import { registerSW } from "virtual:pwa-register"
import { App } from "./App"
import "./index.css"

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
