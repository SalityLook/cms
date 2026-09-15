import type { Actor } from "@selftaught/core";

declare module "h3" {
  interface H3EventContext {
    apiKey?: {
      userId: string;
      scopes: string[];
      keyRowId: string;
      actor: Actor;
    };
  }
}

export {};
