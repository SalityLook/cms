import { and, count as countRows, eq, ilike, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../auth/password";
import type { Database } from "../../db/client";
import { users } from "../../db/schema/users";
import { hooks } from "../../hooks/hook-bus";

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
}

export interface ListUserFilters {
  search?: string;
  status?: "active" | "suspended";
  limit?: number;
  offset?: number;
}

export class UserService {
  constructor(private readonly db: Database) {}

  async create(input: CreateUserInput) {
    const passwordHash = await hashPassword(input.password);
    const [user] = await this.db
      .insert(users)
      .values({ email: input.email.toLowerCase(), passwordHash, displayName: input.displayName })
      .returning();
    if (user) {
      await hooks.emitAction("user:registered", { userId: user.id, email: user.email });
    }
    return user;
  }

  findByEmail(email: string) {
    return this.db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  }

  findById(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  list(filters: ListUserFilters = {}) {
    return this.db.query.users.findMany({
      where: this.buildFilterConditions(filters),
      orderBy: (row, { asc }) => [asc(row.email)],
      limit: filters.limit,
      offset: filters.offset
    });
  }

  async count(filters: Pick<ListUserFilters, "search" | "status"> = {}): Promise<number> {
    const [row] = await this.db
      .select({ value: countRows() })
      .from(users)
      .where(this.buildFilterConditions(filters));
    return row?.value ?? 0;
  }

  private buildFilterConditions(filters: Pick<ListUserFilters, "search" | "status">) {
    const conditions = [];
    if (filters.status) conditions.push(eq(users.status, filters.status));
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(or(ilike(users.email, pattern), ilike(users.displayName, pattern)));
    }
    return conditions.length ? and(...conditions) : undefined;
  }

  async setStatus(id: string, status: "active" | "suspended") {
    const [user] = await this.db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateProfile(id: string, input: { displayName?: string }) {
    const [user] = await this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /** Admin-initiated (or CLI bootstrap script) password reset — no old-password check, unlike a self-service change-password flow would need. */
  async setPassword(id: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);
    const [user] = await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user || user.status !== "active") return null;
    const valid = await verifyPassword(user.passwordHash, password);
    return valid ? user : null;
  }
}
