export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** HTTP means the server answered with a non-2xx status; the other codes mean no usable answer. */
export type ApiErrorCode = "NETWORK" | "TIMEOUT" | "ABORTED" | "HTTP" | "PARSE";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly payload: unknown;

  constructor(message: string, status: number, code: ApiErrorCode, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export const DEFAULT_TIMEOUT_MS = 10_000;

/** Minimal fetch shape the client depends on; the global fetch and test doubles both satisfy it. */
export type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

export interface ApiClientOptions {
  /** Prefix for every request. Empty means same origin (proxied by the dev server). */
  baseUrl?: string;
  timeoutMs?: number;
  /** Injectable for tests. Defaults to the global fetch. */
  fetchImpl?: FetchFunction;
}

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

type BodylessOptions = Omit<RequestOptions, "method" | "body">;

export type ApiErrorListener = (error: ApiError) => void;

export interface ApiClient {
  readonly baseUrl: string;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  get<T>(path: string, options?: BodylessOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  delete<T>(path: string, options?: BodylessOptions): Promise<T>;
  /** Subscribe to every failed request (central error handling). Returns an unsubscribe function. */
  onError(listener: ApiErrorListener): () => void;
}

export function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type ParsedBody = { ok: true; value: unknown } | { ok: false };

function parseBody(text: string): ParsedBody {
  if (text.trim().length === 0) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/** Pulls a short human-readable message out of an error payload without ever echoing HTML. */
function extractMessage(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    const text = payload.trim();
    return text.length > 0 && text.length <= 200 && !text.startsWith("<") ? text : undefined;
  }
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    for (const key of ["detail", "message", "error", "title"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return undefined;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = (options.baseUrl ?? "").trim().replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const listeners = new Set<ApiErrorListener>();

  function notify(error: ApiError): void {
    for (const listener of [...listeners]) {
      try {
        listener(error);
      } catch {
        // A faulty listener must never mask the original API failure.
      }
    }
  }

  async function execute<T>(path: string, init: RequestOptions): Promise<T> {
    const doFetch: FetchFunction = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();
    if (init.signal?.aborted) {
      controller.abort();
    } else {
      init.signal?.addEventListener("abort", forwardAbort, { once: true });
    }

    const headers: Record<string, string> = { Accept: "application/json", ...init.headers };
    let body: string | undefined;
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.body);
    }

    try {
      let response: Response;
      let text: string;
      try {
        response = await doFetch(joinUrl(baseUrl, path), {
          method: init.method ?? "GET",
          headers,
          body,
          signal: controller.signal,
        });
        text = await response.text();
      } catch (cause) {
        if (timedOut) {
          throw new ApiError("The request timed out.", 0, "TIMEOUT", cause);
        }
        if (controller.signal.aborted) {
          throw new ApiError("The request was cancelled.", 0, "ABORTED", cause);
        }
        throw new ApiError("The server could not be reached.", 0, "NETWORK", cause);
      }

      const parsed = parseBody(text);
      if (!response.ok) {
        const payload: unknown = parsed.ok ? parsed.value : text;
        throw new ApiError(
          extractMessage(payload) ?? `The server responded with status ${response.status}.`,
          response.status,
          "HTTP",
          payload,
        );
      }
      if (!parsed.ok) {
        throw new ApiError("The server returned a response that is not valid JSON.", response.status, "PARSE", text);
      }
      return parsed.value as T;
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", forwardAbort);
    }
  }

  async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    try {
      return await execute<T>(path, init);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError("Unexpected error while calling the server.", 0, "NETWORK", error);
      notify(apiError);
      throw apiError;
    }
  }

  const client: ApiClient = {
    baseUrl,
    request,
    get<T>(path: string, opts?: BodylessOptions) {
      return request<T>(path, { ...opts, method: "GET" });
    },
    post<T>(path: string, body?: unknown, opts?: BodylessOptions) {
      return request<T>(path, { ...opts, method: "POST", body });
    },
    put<T>(path: string, body?: unknown, opts?: BodylessOptions) {
      return request<T>(path, { ...opts, method: "PUT", body });
    },
    patch<T>(path: string, body?: unknown, opts?: BodylessOptions) {
      return request<T>(path, { ...opts, method: "PATCH", body });
    },
    delete<T>(path: string, opts?: BodylessOptions) {
      return request<T>(path, { ...opts, method: "DELETE" });
    },
    onError(listener: ApiErrorListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return client;
}
