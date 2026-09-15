import { reusableBlockService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_posts");
  const blocks = await reusableBlockService.list();
  return Promise.all(
    blocks.map(async (block) => ({ ...block, usageCount: await reusableBlockService.usageCount(block.id) }))
  );
});
