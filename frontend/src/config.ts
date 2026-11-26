export function normalizeBaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

// Vite replaces import.meta.env at build time. Outside Vite (for example the Node test runner)
// it is undefined and reading it throws, so fall back to "same origin".
function readBaseUrlFromEnvironment(): string | undefined {
  try {
    return import.meta.env.VITE_API_BASE_URL;
  } catch {
    return undefined;
  }
}

export const config = {
  appName: "QMSync",
  /** Empty string means same origin: the dev server proxies /api and /actuator to the backend. */
  apiBaseUrl: normalizeBaseUrl(readBaseUrlFromEnvironment()),
} as const;
