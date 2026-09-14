import { roleService, userService } from "@selftaught/core/server";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(200)
});

export default defineEventHandler(async (event) => {
  requireCapability(event, "manage_users");
  const { status, search, page, limit } = querySchema.parse(getQuery(event));

  const filters = { status, search };
  const [rows, total] = await Promise.all([
    userService.list({ ...filters, limit, offset: (page - 1) * limit }),
    userService.count(filters)
  ]);

  const items = await Promise.all(
    rows.map(async (user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
      roles: await roleService.rolesForUser(user.id)
    }))
  );

  return { items, page, totalPages: Math.max(1, Math.ceil(total / limit)), total };
});
