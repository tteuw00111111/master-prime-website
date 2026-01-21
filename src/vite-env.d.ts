/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER: string
  readonly VITE_WHATSAPP_MESSAGE: string
  readonly VITE_GOOGLE_MAPS_EMBED_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
