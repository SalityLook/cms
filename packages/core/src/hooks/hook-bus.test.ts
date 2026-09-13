import { describe, expect, it, vi } from "vitest";
import { HookBus } from "./hook-bus";

describe("HookBus", () => {
  it("calls registered action handlers with the payload", async () => {
    const bus = new HookBus();
    const handler = vi.fn();
    bus.onAction("content:published", handler);

    const payload = { content: { id: "1", type: "post", slug: "x", title: "X" } };
    await bus.emitAction("content:published", payload);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("calls multiple handlers registered for the same action", async () => {
    const bus = new HookBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.onAction("user:registered", first);
    bus.onAction("user:registered", second);

    await bus.emitAction("user:registered", { userId: "1", email: "a@b.com" });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("resolves without error when emitting an action with no handlers", async () => {
    const bus = new HookBus();
    await expect(
      bus.emitAction("content:statusChanged", { contentId: "1", type: "post", from: "draft", to: "pending" })
    ).resolves.toBeUndefined();
  });

  it("awaits async handlers before resolving emitAction", async () => {
    const bus = new HookBus();
    let resolved = false;
    bus.onAction("content:published", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      resolved = true;
    });

    await bus.emitAction("content:published", { content: { id: "1", type: "post", slug: "x", title: "X" } });
    expect(resolved).toBe(true);
  });

  it("applyFilter pipes the value through registered filters in registration order", async () => {
    const bus = new HookBus();
    bus.onFilter<number>("double-then-increment", (value) => value * 2);
    bus.onFilter<number>("double-then-increment", (value) => value + 1);

    const result = await bus.applyFilter("double-then-increment", 5);
    expect(result).toBe(11);
  });

  it("applyFilter returns the original value untouched when no filters are registered", async () => {
    const bus = new HookBus();
    const result = await bus.applyFilter("nonexistent-filter", "unchanged");
    expect(result).toBe("unchanged");
  });

  it("keeps filters registered under different names independent", async () => {
    const bus = new HookBus();
    bus.onFilter<string>("greeting", (value) => `hello ${value}`);
    bus.onFilter<string>("farewell", (value) => `bye ${value}`);

    expect(await bus.applyFilter("greeting", "world")).toBe("hello world");
    expect(await bus.applyFilter("farewell", "world")).toBe("bye world");
  });
});
