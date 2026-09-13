import type { Actor } from "@selftaught/core";

declare module "h3" {
  interface H3EventContext {
    actor?: Actor | null;
  }
}

export {};
