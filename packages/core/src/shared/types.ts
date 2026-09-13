import type { CapabilityKey } from "../registry/capabilities";

/** Safe user shape — never includes passwordHash. Client-importable. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

/** Resolved per-request from the DB by the auth middleware; never trust a cached copy for authorization. */
export interface Actor extends AuthUser {
  capabilities: CapabilityKey[];
}
