import { describe, expect, it } from "vitest";
import { taxonomyRegistry } from "./taxonomies";

describe("taxonomyRegistry", () => {
  it("has 'category' registered as hierarchical and 'tag' as flat", () => {
    expect(taxonomyRegistry.get("category")?.hierarchical).toBe(true);
    expect(taxonomyRegistry.get("tag")?.hierarchical).toBe(false);
  });

  it("both built-in taxonomies apply to 'post'", () => {
    expect(taxonomyRegistry.get("category")?.appliesTo).toContain("post");
    expect(taxonomyRegistry.get("tag")?.appliesTo).toContain("post");
  });

  it("register() adds a new taxonomy retrievable via get()/list()", () => {
    const key = `vitest_taxonomy_${Date.now()}`;
    taxonomyRegistry.register({ key, label: "Vitest Taxonomy", appliesTo: ["post"] });

    expect(taxonomyRegistry.get(key)?.label).toBe("Vitest Taxonomy");
    expect(taxonomyRegistry.list().some((definition) => definition.key === key)).toBe(true);
  });
});
