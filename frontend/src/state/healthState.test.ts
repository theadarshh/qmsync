import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { ApiError, createApiClient } from "../api/client";
import type { ApiClient, FetchFunction } from "../api/client";
import { LOADING_STATE, describeHealthError, loadHealth } from "./healthState";

function clientWith(fetchImpl: FetchFunction): ApiClient {
  return createApiClient({ fetchImpl });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const now = () => 1234;

describe("loadHealth", () => {
  test("reports an UP backend with its database status", async () => {
    const client = clientWith(async () => json({ status: "UP", components: { db: { status: "UP" } } }));

    assert.deepEqual(await loadHealth(client, now), {
      phase: "reachable",
      overall: "UP",
      database: "UP",
      checkedAt: 1234,
    });
  });

  test("reports the database as unknown when no components are exposed", async () => {
    const client = clientWith(async () => json({ status: "UP" }));

    assert.deepEqual(await loadHealth(client, now), {
      phase: "reachable",
      overall: "UP",
      database: null,
      checkedAt: 1234,
    });
  });

  test("reports a DOWN backend as reachable with a DOWN status", async () => {
    const client = clientWith(async () => json({ status: "DOWN", components: { db: { status: "DOWN" } } }, 503));

    assert.deepEqual(await loadHealth(client, now), {
      phase: "reachable",
      overall: "DOWN",
      database: "DOWN",
      checkedAt: 1234,
    });
  });

  test("reports an unreachable backend instead of throwing", async () => {
    const client = clientWith(async () => {
      throw new TypeError("fetch failed");
    });

    assert.deepEqual(await loadHealth(client, now), {
      phase: "unreachable",
      message: "The backend could not be reached. Check that the QMSync backend is running.",
      checkedAt: 1234,
    });
  });

  test("explains a response that is not a health report", async () => {
    const client = clientWith(async () => new Response("<!doctype html><html></html>", { status: 200 }));
    const state = await loadHealth(client, now);

    assert.equal(state.phase, "unreachable");
    assert.ok(state.phase === "unreachable" && state.message.includes("forwards /actuator"));
  });

  test("reports the HTTP status of an unexpected failure", async () => {
    const client = clientWith(async () => json({ error: "Internal Server Error" }, 500));

    assert.deepEqual(await loadHealth(client, now), {
      phase: "unreachable",
      message: "The backend answered with HTTP status 500.",
      checkedAt: 1234,
    });
  });
});

describe("describeHealthError", () => {
  test("has a distinct message for timeouts, cancellations and unknown errors", () => {
    assert.equal(describeHealthError(new ApiError("x", 0, "TIMEOUT")), "The backend did not answer in time.");
    assert.equal(describeHealthError(new ApiError("x", 0, "ABORTED")), "The status check was cancelled.");
    assert.equal(describeHealthError(new Error("surprise")), "The backend status could not be determined.");
  });

  test("the initial state is loading", () => {
    assert.deepEqual(LOADING_STATE, { phase: "loading" });
  });
});
