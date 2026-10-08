/// <reference types="vite/client" />

declare module "virtual:pwa-register" {
  export function registerSW(options?: { immediate?: boolean }): (reloadPage?: boolean) => Promise<void>
}

interface ImportMetaEnv {
  readonly VITE_RELAY_URL?: string
  readonly VITE_STUN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
