// Minimal typings for the Vite environment values this app reads.
// Only VITE_-prefixed variables are exposed to browser code by Vite: never put secrets in them.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";
