import type { CapabilityKey } from "@selftaught/core";
import type { H3Event } from "h3";

export function requireCapability(event: H3Event, capability: CapabilityKey) {
  const actor = event.context.actor;
  if (!actor) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }
  if (!actor.capabilities.includes(capability)) {
    throw createError({ statusCode: 403, statusMessage: "Insufficient permissions" });
  }
  return actor;
}
