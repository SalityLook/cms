# Public REST API (v1)

Read-only access to published content, plus authenticated comment
submission. Deliberately **not** a full remote-authoring API — there is
no way to create/edit/publish content through this API, only through the
admin dashboard. If that's ever needed, it should be a new, explicitly
scoped phase, not something this document quietly grows into.

Base URL: `https://<your-site>/api/v1/`

## Authentication

Most endpoints need no authentication at all — they return the exact same
published content anyone can already see on the public site.

`POST /comments` requires an API key, sent as a bearer token:

```
Authorization: Bearer stk_<keyId>.<secret>
```

Generate a key from the admin dashboard's **Akun Saya → API Keys** card.
The full key is shown **once**, at creation — it cannot be retrieved
again, only revoked and replaced with a new one. A key is tied to the
admin user who created it; comments posted with it are attributed to that
user.

There is no scope enforcement yet beyond "is this key valid and not
revoked" — every valid key can hit every endpoint below. `scopes` exists
in the schema for forward compatibility if the API surface grows.

## Endpoints

### `GET /posts`

Paginated list of published posts.

Query params: `page` (default 1), `limit` (default 20, max 50).

```json
{ "posts": [{ "id": "...", "slug": "...", "title": "...", "excerpt": "...", "publishedAt": "..." }], "page": 1, "totalPages": 3, "total": 42 }
```

### `GET /posts/:slug`

A single published post, including its full block-JSON `content` and
assigned terms. 404 if the slug doesn't exist **or** isn't published —
there is no query parameter, header, or API key scope that changes this;
draft/scheduled/trashed content is never reachable through this endpoint.

### `GET /pages/:slug`

Same idea as `/posts/:slug`, for the `page` content type.

### `GET /categories`, `GET /tags`

Flat list of all terms in that taxonomy (`id`, `slug`, `name`,
`description`, `parentId`).

### `POST /comments` (requires an API key)

```json
{ "contentId": "<uuid>", "parentId": null, "body": "..." }
```

`contentId` must point to a **published** post or page or this 404s —
same rule as the public anonymous comment form. Rate-limited per API key
(not per IP), independent of the public form's own IP-based limit.

Returns `{ "id": "...", "status": "pending" | "approved" }` depending on
the site's comment-approval setting.

## Rate limits

- Unauthenticated read endpoints: no dedicated limit beyond whatever
  reverse-proxy/infra limits exist in front of the whole site.
- `POST /comments`: 20 requests / 15 minutes per API key.

## What this API will never do

- Create, update, publish, or delete content.
- Return anything not already `published`, regardless of who's asking.
- Accept a scope or header that unlocks draft content — this has an
  explicit negative test in the project's own verification history
  (see CLAUDE.md, Phase 23).
