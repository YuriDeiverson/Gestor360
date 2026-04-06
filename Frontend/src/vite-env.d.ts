/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_LOCAL_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  // mais variáveis de ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
