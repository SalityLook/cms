/**
 * Framework-agnostic domain error classes — deliberately plain `Error`
 * subclasses with no dependency on h3/Nitro (core must stay usable outside
 * a Nuxt server context). The Nuxt apps map these to precise HTTP status
 * codes at their own boundary (see apps/admin/server/utils/api-handler.ts).
 * Before this, every one of these surfaced as a generic HTTP 500 — the
 * message was still correct, just not the status code (documented as a
 * known gap in CLAUDE.md for a long time before being addressed here).
 */

/** Actor lacks the capability required for the attempted action. Maps to 403. */
export class CapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilityError";
  }
}

/** Referenced entity (content, revision, term, media, user, ...) does not exist. Maps to 404. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Requested state transition isn't allowed from the entity's current state. Maps to 409. */
export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}

/** Input failed a domain-level validation rule (distinct from zod schema validation, which already 400s at the API boundary). Maps to 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
