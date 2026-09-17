/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_DESKTOP?: string
  readonly VITE_FAKE_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
