import { contentService, revisionService } from "@selftaught/core/server";
import { z } from "zod";

const querySchema = z.object({
  from: z.string().uuid(),
  to: z.string() // either a revision id (uuid) or the literal "current"
});

export default defineApiHandler(async (event) => {
  requireCapability(event, "edit_pages");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const { from, to } = await getValidatedQuery(event, querySchema.parse);

  const fromRevision = await revisionService.getById(from);
  if (!fromRevision || fromRevision.contentId !== id) {
    throw createError({ statusCode: 404, statusMessage: "Revision not found" });
  }

  let toDoc;
  if (to === "current") {
    const page = await contentService.getById(id);
    if (!page) {
      throw createError({ statusCode: 404, statusMessage: "Content not found" });
    }
    toDoc = page.content;
  } else {
    const toRevision = await revisionService.getById(to);
    if (!toRevision || toRevision.contentId !== id) {
      throw createError({ statusCode: 404, statusMessage: "Revision not found" });
    }
    toDoc = toRevision.content;
  }

  return { parts: revisionService.diffDocuments(fromRevision.content, toDoc) };
});
