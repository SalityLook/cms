import { describe, expect, it } from "vitest";
import type { Actor } from "../../shared/types";
import { PermissionService } from "./permission-service";

describe("PermissionService.can", () => {
  // can() is pure logic over an already-resolved Actor — it never touches
  // roleService/userService (only loadActor() does), so they're safely
  // unused here rather than needing a real DB or mocks.
  const service = new PermissionService(null as never, null as never);

  const actor: Actor = {
    id: "actor-1",
    email: "a@b.com",
    displayName: "A",
    roles: ["author"],
    capabilities: ["edit_posts", "publish_posts"]
  };

  it("returns true when the actor has the capability", () => {
    expect(service.can(actor, "edit_posts")).toBe(true);
  });

  it("returns false when the actor lacks the capability", () => {
    expect(service.can(actor, "manage_users")).toBe(false);
  });

  it("returns false for a null actor", () => {
    expect(service.can(null, "edit_posts")).toBe(false);
  });

  it("returns false for an undefined actor", () => {
    expect(service.can(undefined, "edit_posts")).toBe(false);
  });

  it("returns false for an actor with no capabilities", () => {
    const bare: Actor = { ...actor, capabilities: [] };
    expect(service.can(bare, "edit_posts")).toBe(false);
  });
});
