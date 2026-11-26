import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { ApiError, createApiClient, joinUrl } from "./client";
import type { FetchFunction } from "./client";

interface RecordedCall {
  url: string;
  init: RequestInit | undefined;
}

function recordingFetch(respond: () => Response): { fetchImpl: FetchFunction; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchImpl: FetchFunction = async (input, init) => {
    calls.push({ url: input, init });
    return respond();
  };
  return { fetchImpl, calls };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A fetch that never answers and rejects like the real one when its signal aborts. */
const hangingFetch: FetchFunction = (_input, init) =>
  new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    const abort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }
  });

describe("joinUrl", () => {
  test("joins base and path with exactly one slash", () => {
    assert.equal(joinUrl("", "/actuator/health"), "/actuator/health");
    assert.equal(joinUrl("http://localhost:8080/", "/api/x"), "http://localhost:8080/api/x");
    assert.equal(joinUrl("http://localhost:8080", "api/x"), "http://localhost:8080/api/x");
  });
});

describe("createApiClient: successful requests", () => {
  test("GET returns the parsed JSON body and asks for JSON", async () => {
    const { fetchImpl, calls } = recordingFetch(() => json({ ok: true }));
    const client = createApiClient({ baseUrl: "http://api.test/", fetchImpl });

    const result = await client.get<{ ok: boolean }>("/ping");

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "http://api.test/ping");
    assert.equal(calls[0]?.init?.method, "GET");
    assert.equal(calls[0]?.init?.body, undefined);
    const headers = calls[0]?.init?.headers as Record<string, string>;
    assert.equal(headers.Accept, "application/json");
  });

  test("POST sends a JSON body with a content type", async () => {
    const { fetchImpl, calls } = recordingFetch(() => json({ id: 7 }, 201));
    const client = createApiClient({ fetchImpl });

    const result = await client.post<{ id: number }>("/api/items", { name: "Bracket" });

    assert.deepEqual(result, { id: 7 });
    assert.equal(calls[0]?.url, "/api/items");
    assert.equal(calls[0]?.init?.method, "POST");
    assert.equal(calls[0]?.init?.body, '{"name":"Bracket"}');
    const headers = calls[0]?.init?.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], "application/json");
  });

  test("an empty 204 response resolves to undefined", async () => {
    const { fetchImpl } = recordingFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetchImpl });

    assert.equal(await client.delete("/api/items/7"), undefined);
  });
});

describe("createApiClient: failures", () => {
  test("a JSON error body becomes an ApiError carrying status, code and payload", async () => {
    const body = { message: "Name is required", status: 400 };
    const { fetchImpl } = recordingFetch(() => json(body, 400));
    const client = createApiClient({ fetchImpl });

    await assert.rejects(client.get("/api/items"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "HTTP");
      assert.equal(error.message, "Name is required");
      assert.deepEqual(error.payload, body);
      return true;
    });
  });

  test("prefers the detail field of a problem-details body", async () => {
    const { fetchImpl } = recordingFetch(() => json({ title: "Not Found", detail: "Item 7 does not exist" }, 404));
    const client = createApiClient({ fetchImpl });

    await assert.rejects(client.get("/api/items/7"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "Item 7 does not exist");
      return true;
    });
  });

  test("never echoes an HTML error page as the message", async () => {
    const html = "<html><body>Bad gateway</body></html>";
    const { fetchImpl } = recordingFetch(() => new Response(html, { status: 502 }));
    const client = createApiClient({ fetchImpl });

    await assert.rejects(client.get("/api/items"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 502);
      assert.equal(error.code, "HTTP");
      assert.equal(error.message, "The server responded with status 502.");
      assert.equal(error.payload, html);
      return true;
    });
  });

  test("a rejected fetch becomes a NETWORK error with status 0", async () => {
    const fetchImpl: FetchFunction = async () => {
      throw new TypeError("fetch failed");
    };
    const client = createApiClient({ fetchImpl });

    await assert.rejects(client.get("/api/items"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "NETWORK");
      assert.equal(error.status, 0);
      assert.ok(error.payload instanceof TypeError);
      return true;
    });
  });

  test("a request that exceeds the timeout becomes a TIMEOUT error", async () => {
    const client = createApiClient({ fetchImpl: hangingFetch, timeoutMs: 25 });

    await assert.rejects(client.get("/slow"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "TIMEOUT");
      assert.equal(error.status, 0);
      return true;
    });
  });

  test("cancelling through the caller's signal becomes an ABORTED error", async () => {
    const controller = new AbortController();
    const client = createApiClient({ fetchImpl: hangingFetch, timeoutMs: 5_000 });

    const pending = client.get("/slow", { signal: controller.signal });
    controller.abort();

    await assert.rejects(pending, (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "ABORTED");
      return true;
    });
  });

  test("an already-aborted signal fails without waiting for the timeout", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = createApiClient({ fetchImpl: hangingFetch, timeoutMs: 5_000 });

    await assert.rejects(client.get("/slow", { signal: controller.signal }), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "ABORTED");
      return true;
    });
  });

  test("a 200 response that is not JSON becomes a PARSE error", async () => {
    const { fetchImpl } = recordingFetch(() => new Response("<!doctype html><html></html>", { status: 200 }));
    const client = createApiClient({ fetchImpl });

    await assert.rejects(client.get("/api/items"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "PARSE");
      assert.equal(error.status, 200);
      return true;
    });
  });
});

describe("createApiClient: central error handling", () => {
  test("notifies listeners once per failed request and stops after unsubscribe", async () => {
    const { fetchImpl } = recordingFetch(() => json({ message: "boom" }, 500));
    const client = createApiClient({ fetchImpl });
    const seen: ApiError[] = [];
    const unsubscribe = client.onError((error) => {
      seen.push(error);
    });

    await assert.rejects(client.get("/api/items"));
    assert.equal(seen.length, 1);
    assert.equal(seen[0]?.status, 500);

    unsubscribe();
    await assert.rejects(client.get("/api/items"));
    assert.equal(seen.length, 1);
  });

  test("does not notify listeners for successful requests", async () => {
    const { fetchImpl } = recordingFetch(() => json({ ok: true }));
    const client = createApiClient({ fetchImpl });
    let notified = 0;
    client.onError(() => {
      notified += 1;
    });

    await client.get("/api/items");

    assert.equal(notified, 0);
  });

  test("a throwing listener does not mask the original API error", async () => {
    const { fetchImpl } = recordingFetch(() => json({ message: "boom" }, 500));
    const client = createApiClient({ fetchImpl });
    client.onError(() => {
      throw new Error("listener failure");
    });

    await assert.rejects(client.get("/api/items"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "boom");
      return true;
    });
  });
});
