import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/literata/wght.css"
import "@fontsource-variable/literata/wght-italic.css"
import "@fontsource-variable/source-sans-3/wght.css"
import { registerSW } from "virtual:pwa-register"
import { App } from "./App"
import "./index.css"

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
