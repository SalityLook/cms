import { menuService } from "@selftaught/core/server";
import { z } from "zod";

const bodySchema = z.object({
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255)
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "manage_menus");
  const body = await readValidatedBody(event, bodySchema.parse);
  return menuService.createMenu(body);
});
