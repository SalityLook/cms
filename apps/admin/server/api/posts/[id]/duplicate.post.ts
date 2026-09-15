import { contentMetaService, contentService, seoService, taxonomyService } from "@selftaught/core/server";

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "edit_posts");
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id" });
  }

  const duplicate = await contentService.duplicate(actor, id);

  const [terms, meta, seo] = await Promise.all([
    taxonomyService.termsForContent(id),
    contentMetaService.getAll(id),
    seoService.getForContent(id)
  ]);

  await Promise.all([
    terms.length > 0 ? taxonomyService.assignTerms(duplicate.id, terms.map((term) => term.id)) : Promise.resolve(),
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
