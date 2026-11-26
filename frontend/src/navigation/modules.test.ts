import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { MODULES, NAV_GROUPS, findModuleByPath, modulesInGroup, requireModule } from "./modules";

describe("module registry", () => {
  test("ids, paths and labels are unique", () => {
    for (const key of ["id", "path", "label"] as const) {
      const values = MODULES.map((entry) => entry[key]);
      assert.equal(new Set(values).size, values.length, `${key} values must be unique`);
    }
  });

  test("paths are single-segment, lowercase and never the dashboard", () => {
    for (const entry of MODULES) {
      assert.match(entry.path, /^\/[a-z-]+$/);
    }
  });

  test("covers modules B to J of the product plan exactly once", () => {
    const codes = MODULES.map((entry) => entry.moduleCode).sort();
    assert.deepEqual(codes, ["B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  });

  test("every module describes what it will contain", () => {
    for (const entry of MODULES) {
      assert.ok(entry.summary.length > 0, `${entry.id} needs a summary`);
      assert.ok(entry.capabilities.length >= 6, `${entry.id} needs its planned capabilities`);
      assert.equal(new Set(entry.capabilities).size, entry.capabilities.length, `${entry.id} capabilities are unique`);
    }
  });

  test("every module belongs to a declared group and every group is used", () => {
    const groupIds = NAV_GROUPS.map((group) => group.id);
    for (const entry of MODULES) {
      assert.ok(groupIds.includes(entry.group), `${entry.id} has an unknown group`);
    }
    for (const group of NAV_GROUPS) {
      assert.ok(modulesInGroup(group.id).length > 0, `${group.id} has no modules`);
    }
  });

  test("findModuleByPath normalizes the path and ignores unknown routes", () => {
    assert.equal(findModuleByPath("/ncmr")?.id, "ncmr");
    assert.equal(findModuleByPath("/ncmr/")?.id, "ncmr");
    assert.equal(findModuleByPath("/does-not-exist"), undefined);
    assert.equal(findModuleByPath("/"), undefined);
  });

  test("requireModule throws for an unknown id", () => {
    assert.equal(requireModule("capa").label, "CAPA");
    assert.throws(() => requireModule("nope"), /Unknown module id: nope/);
  });
});
