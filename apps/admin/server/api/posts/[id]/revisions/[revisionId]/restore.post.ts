import { contentService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  const revisionId = getRouterParam(event, "revisionId");
  if (!id || !revisionId) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  return contentService.restoreRevision(actor, id, revisionId);
});
