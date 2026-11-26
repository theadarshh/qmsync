import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { isActivePath, normalizePath } from "./match";

describe("normalizePath", () => {
  test("strips query, hash and trailing slashes", () => {
    assert.equal(normalizePath("/ncmr/"), "/ncmr");
    assert.equal(normalizePath("/ncmr?tab=1"), "/ncmr");
    assert.equal(normalizePath("/ncmr#top"), "/ncmr");
    assert.equal(normalizePath("//"), "/");
    assert.equal(normalizePath(""), "/");
  });

  test("adds a missing leading slash", () => {
    assert.equal(normalizePath("capa"), "/capa");
  });
});

describe("isActivePath", () => {
  test("the dashboard is active only on an exact match", () => {
    assert.equal(isActivePath("/", "/"), true);
    assert.equal(isActivePath("/ncmr", "/"), false);
  });

  test("a module is active on its own path and sub-paths but not on look-alikes", () => {
    assert.equal(isActivePath("/ncmr", "/ncmr"), true);
    assert.equal(isActivePath("/ncmr/", "/ncmr"), true);
    assert.equal(isActivePath("/ncmr/42", "/ncmr"), true);
    assert.equal(isActivePath("/ncmr-archive", "/ncmr"), false);
    assert.equal(isActivePath("/capa", "/ncmr"), false);
  });
});
