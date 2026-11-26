import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { config } from "../config";
import { createApiClient } from "./client";
import type { ApiClient } from "./client";

/** The single API client used by the running application. Tests inject their own through the provider. */
export const defaultApiClient: ApiClient = createApiClient({ baseUrl: config.apiBaseUrl });

const ApiClientContext = createContext<ApiClient>(defaultApiClient);

export function ApiClientProvider({ client, children }: { client: ApiClient; children?: ReactNode }) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

export function useApiClient(): ApiClient {
  return useContext(ApiClientContext);
}
