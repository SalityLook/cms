import type { ContentDocument } from "@selftaught/core";

/**
 * Nuxt's typed-fetch feature matches every `$fetch`/`useFetch` URL against a
 * discriminated union of known server routes to infer the response type.
 * Once an app accumulates enough dynamic-segment API routes (posts/[id]/
 * revisions/[revisionId]/restore etc.), that literal-type matching blows
 * TypeScript's recursion limit ("Excessive stack depth comparing types"),
 * and it happens for BOTH literal and widened-to-`string` URLs — widening
 * alone does not fix it. `apiFetch`/`useApiFetch` cast the request through
 * `any` to skip that matching entirely, and take an explicit `<T>` generic
 * instead so responses stay typed without relying on fragile inference.
 */
export function apiFetch<T = unknown>(url: string, opts?: Record<string, unknown>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return $fetch(url as any, opts as any) as Promise<T>;
}

export function useApiFetch<T>(url: string, opts?: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useFetch(url as any, opts as any) as ReturnType<typeof useFetch<T>>;
}

export interface TermSummary {
  id: string;
  taxonomy: string;
  slug: string;
  name: string;
}

export type ContentStatus = "draft" | "pending" | "scheduled" | "published" | "trashed";

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  updatedAt: string;
}

export interface PostDetail {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: ContentDocument;
  status: ContentStatus;
  authorId: string;
  featuredMediaId: string | null;
  featuredMediaUrl: string | null;
  parentId: string | null;
  menuOrder: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  terms: TermSummary[];
}

export interface MediaItem {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface RevisionSummary {
  id: string;
  title: string;
  createdAt: string;
}
