/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Base URL of diver_auth — register, login, refresh, logout. */
  readonly VITE_AUTH_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
