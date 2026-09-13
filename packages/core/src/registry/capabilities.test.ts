import { describe, expect, it } from "vitest";
import { CAPABILITIES, capabilityRegistry } from "./capabilities";

describe("capabilityRegistry", () => {
  it("is pre-seeded with every built-in CAPABILITIES key", () => {
    for (const key of CAPABILITIES) {
      expect(capabilityRegistry.has(key)).toBe(true);
    }
  });

  it("register() adds a new capability reflected by has()/list()", () => {
    const key = `vitest_capability_${Date.now()}`;
    expect(capabilityRegistry.has(key)).toBe(false);

    capabilityRegistry.register({ key, description: "test capability" });

    expect(capabilityRegistry.has(key)).toBe(true);
    expect(capabilityRegistry.list().some((definition) => definition.key === key)).toBe(true);
  });

  it("register() with the same key twice overwrites rather than duplicating", () => {
    const key = `vitest_capability_dup_${Date.now()}`;
    capabilityRegistry.register({ key, description: "first" });
    capabilityRegistry.register({ key, description: "second" });

    const matches = capabilityRegistry.list().filter((definition) => definition.key === key);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.description).toBe("second");
  });

  it("has() returns false for an unknown key", () => {
    expect(capabilityRegistry.has(`vitest_never_registered_${Date.now()}`)).toBe(false);
  });
});
