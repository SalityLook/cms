import { contentMetaService, contentService, seoService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_pages");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const duplicate = await contentService.duplicate(actor, id);

  const [meta, seo] = await Promise.all([contentMetaService.getAll(id), seoService.getForContent(id)]);

  await Promise.all([
    ...Object.entries(meta).map(([key, value]) => contentMetaService.set(duplicate.id, key, value)),
    seo
      ? seoService.upsert(duplicate.id, {
          title: seo.title,
          description: seo.description,
          ogImageMediaId: seo.ogImageMediaId,
          canonicalUrl: seo.canonicalUrl,
          noindex: seo.noindex,
          structuredDataOverride: seo.structuredDataOverride as Record<string, unknown> | null
        })
      : Promise.resolve()
  ]);

  return duplicate;
});
