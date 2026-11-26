import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { config, normalizeBaseUrl } from "./config";

describe("normalizeBaseUrl", () => {
  test("trims whitespace and trailing slashes", () => {
    assert.equal(normalizeBaseUrl("  http://localhost:8080/  "), "http://localhost:8080");
    assert.equal(normalizeBaseUrl("http://localhost:8080///"), "http://localhost:8080");
  });

  test("treats a missing or blank value as same origin", () => {
    assert.equal(normalizeBaseUrl(undefined), "");
    assert.equal(normalizeBaseUrl("   "), "");
  });
});

describe("config", () => {
  test("defaults to same origin when no Vite environment is present", () => {
    assert.equal(config.apiBaseUrl, "");
    assert.equal(config.appName, "QMSync");
  });
});
