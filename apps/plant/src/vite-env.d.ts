/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PLANT_API_URL: string;
  readonly VITE_PLANT_TENANT_ID?: string;
  readonly VITE_PLANT_WS_URL: string;
  readonly VITE_CAPGO_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
