import type { ContentDocument } from "@selftaught/core";
import type { Ref } from "vue";

/**
 * Nuxt's typed-fetch feature matches every `$fetch`/`useFetch` URL against a
 * discriminated union of known server routes to infer the response type.
 * Once an app accumulates enough dynamic-segment API routes (posts/[id]/
 * revisions/[revisionId]/restore, posts/[id]/meta, etc.), that literal-type
 * matching blows TypeScript's recursion limit ("Excessive stack depth
 * comparing types") — and NOT just for literal URLs. `$fetch(url as any)`
 * still fails once the route surface is big enough: TS has to resolve
 * `$fetch`'s full overload set to pick a match BEFORE the `any` argument can
 * short-circuit anything, and that resolution itself is what blows up.
 *
 * The only reliable fix is to never let TS resolve `$fetch`'s real (complex)
 * type at a call site at all. `useRequestFetch()` (a request-scoped $fetch
 * that forwards the incoming request's cookies/headers during SSR, and is a
 * no-op alias for plain $fetch on the client — the documented, correct way
 * to make an internal API call from SSR code) is cast to a plain function
 * type via `unknown` BEFORE calling it, so every actual call afterward goes
 * through our simple type instead of the original.
 *
 * An earlier version grabbed `$fetch` off `globalThis` once at module load
 * instead — that avoided the type error too, but silently broke SSR: it
 * captured a non-request-scoped fetch with no cookie forwarding, so
 * server-rendered pages calling apiFetch got empty responses even with a
 * valid session cookie in the actual browser request. `useRequestFetch()`
 * must be called fresh inside the function (not hoisted to module scope) —
 * it needs Nuxt's current-request context, which only exists per-call.
 */
type PlainFetch = (url: string, opts?: Record<string, unknown>) => Promise<unknown>;

export async function apiFetch<T = unknown>(url: string, opts?: Record<string, unknown>): Promise<T> {
  const doFetch = useRequestFetch() as unknown as PlainFetch;
  return (await doFetch(url, opts)) as T;
}

/**
 * Built on useAsyncData (keyed by a plain string, no per-route type matching)
 * rather than useFetch, which suffers the same problem as raw $fetch above.
 *
 * MUST stay an `async` function that `await`s `useAsyncData(...)` itself
 * (not just return its result synchronously): `useAsyncData`'s return value
 * is specially awaitable — Nuxt's SSR data-fetching only actually blocks
 * rendering until the fetch resolves when YOU await that exact object.
 * Returning a freshly-built plain `{ data, pending, ... }` object (even one
 * containing the same refs) is just a normal object with no such behavior,
 * so `await useApiFetch(...)` would resolve on the next microtask with
 * `data` still empty/default — which is exactly the bug this used to have
 * (pages read `post.value` as null and 404'd, even though the underlying
 * fetch succeeded moments later).
 */
export interface ApiFetchResult<T> {
  data: Ref<T | null>;
  pending: Ref<boolean>;
  error: Ref<unknown>;
  refresh: () => Promise<void>;
  execute: () => Promise<void>;
}

export async function useApiFetch<T>(url: string, opts?: Record<string, unknown>): Promise<ApiFetchResult<T>> {
  const { data, pending, error, refresh, execute } = await useAsyncData<T | null>(
    url,
    () => apiFetch<T>(url, opts),
    { default: () => null }
  );
  return { data: data as Ref<T | null>, pending, error, refresh, execute };
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

export type PageSummary = PostSummary;
export type PageDetail = Omit<PostDetail, "terms">;

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

export interface ContentSeo {
  contentId: string;
  title: string | null;
  description: string | null;
  ogImageMediaId: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  structuredDataOverride: Record<string, unknown> | null;
  updatedAt: string;
}

export type SettingsMap = Record<string, unknown>;

export type UserStatus = "active" | "suspended";

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  roles: string[];
}

export interface RoleSummary {
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  capabilities: string[];
}
