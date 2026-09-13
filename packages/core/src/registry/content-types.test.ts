import { describe, expect, it } from "vitest";
import { contentTypeRegistry } from "./content-types";

describe("contentTypeRegistry", () => {
  it("has 'post' registered with the expected capability map and shape", () => {
    const post = contentTypeRegistry.get("post");
    expect(post).toBeDefined();
    expect(post?.hierarchical).toBe(false);
    expect(post?.capabilityMap).toEqual({
      edit: "edit_posts",
      editOthers: "edit_others_posts",
      publish: "publish_posts",
      delete: "delete_posts"
    });
    expect(post?.supports).toContain("categories");
    expect(post?.supports).toContain("tags");
  });

  it("has 'page' registered as hierarchical, sharing one capability for edit/publish/delete", () => {
    const page = contentTypeRegistry.get("page");
    expect(page).toBeDefined();
    expect(page?.hierarchical).toBe(true);
    expect(page?.capabilityMap.edit).toBe("edit_pages");
    expect(page?.capabilityMap.editOthers).toBe("edit_pages");
    expect(page?.capabilityMap.publish).toBe("edit_pages");
    expect(page?.capabilityMap.delete).toBe("edit_pages");
    expect(page?.supports).not.toContain("categories");
  });

  it("get() returns undefined for an unregistered type", () => {
    expect(contentTypeRegistry.get(`vitest_missing_type_${Date.now()}`)).toBeUndefined();
  });

  it("register() adds a new content type retrievable via get()/list()", () => {
    const key = `vitest_type_${Date.now()}`;
    contentTypeRegistry.register({
      key,
      label: "Vitest Type",
      supports: ["title"],
      capabilityMap: {
        edit: "edit_posts",
        editOthers: "edit_others_posts",
        publish: "publish_posts",
        delete: "delete_posts"
      }
    });

    expect(contentTypeRegistry.get(key)?.label).toBe("Vitest Type");
    expect(contentTypeRegistry.list().some((definition) => definition.key === key)).toBe(true);
  });
});
