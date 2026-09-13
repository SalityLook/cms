import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../auth/password";
import type { Database } from "../../db/client";
import { users } from "../../db/schema/users";
import { hooks } from "../../hooks/hook-bus";

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
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

  list() {
    return this.db.query.users.findMany();
  }

  async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user || user.status !== "active") return null;
    const valid = await verifyPassword(user.passwordHash, password);
    return valid ? user : null;
  }
}
