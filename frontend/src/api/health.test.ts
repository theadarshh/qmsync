import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { ApiError, createApiClient } from "./client";
import type { ApiClient, FetchFunction } from "./client";
import { HEALTH_PATH, fetchHealth, isHealthReport } from "./health";

function clientAnswering(respond: () => Response): { client: ApiClient; urls: string[] } {
  const urls: string[] = [];
  const fetchImpl: FetchFunction = async (input) => {
    urls.push(input);
    return respond();
  };
  return { client: createApiClient({ fetchImpl }), urls };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("fetchHealth", () => {
  test("requests the Actuator health endpoint and returns the report", async () => {
    const report = { status: "UP", components: { db: { status: "UP" }, ping: { status: "UP" } } };
    const { client, urls } = clientAnswering(() => json(report));

    assert.deepEqual(await fetchHealth(client), report);
    assert.deepEqual(urls, [HEALTH_PATH]);
    assert.equal(HEALTH_PATH, "/actuator/health");
  });

  test("returns a DOWN report that Actuator delivers with HTTP 503", async () => {
    const report = { status: "DOWN", components: { db: { status: "DOWN" } } };
    const { client } = clientAnswering(() => json(report, 503));

    assert.deepEqual(await fetchHealth(client), report);
  });

  test("rejects other HTTP failures", async () => {
    const { client } = clientAnswering(() => json({ error: "Internal Server Error" }, 500));

    await assert.rejects(fetchHealth(client), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 500);
      return true;
    });
  });

  test("rejects a 503 that is not a health report", async () => {
    const { client } = clientAnswering(() => new Response("<html>Service Unavailable</html>", { status: 503 }));

    await assert.rejects(fetchHealth(client), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      return true;
    });
  });

  test("rejects a 200 response that is not a health report", async () => {
    const { client } = clientAnswering(() => json({ hello: "world" }));

    await assert.rejects(fetchHealth(client), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "PARSE");
      return true;
    });
  });
});

describe("isHealthReport", () => {
  test("accepts objects with a string status and nothing else", () => {
    assert.equal(isHealthReport({ status: "UP" }), true);
    assert.equal(isHealthReport({ status: "DOWN", components: {} }), true);
    assert.equal(isHealthReport(null), false);
    assert.equal(isHealthReport("UP"), false);
    assert.equal(isHealthReport({}), false);
    assert.equal(isHealthReport({ status: 1 }), false);
  });
});
