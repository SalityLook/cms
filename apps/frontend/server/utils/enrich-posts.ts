import { mediaService, taxonomyService } from "@selftaught/core/server";

interface ContentLike {
  id: string;
  featuredMediaId: string | null;
}

/**
 * Archive/listing endpoints (index, category, tag) return raw `content` rows
 * from ContentService.list(), which only carry `featuredMediaId` (a media
 * row id, NOT a URL — see CLAUDE.md Gotcha #12) and no term data. Card UI
 * needs a resolved image URL and category badges, so this batch-resolves
 * both per post. Fine at this scale (page sizes are small, ~10-50 posts);
 * would need a real batch query if that ever changes.
 */
export async function enrichPostsForCards<T extends ContentLike>(posts: T[]) {
  return Promise.all(
    posts.map(async (post) => {
      const [featuredMedia, terms] = await Promise.all([
        post.featuredMediaId ? mediaService.getByIdWithUrl(post.featuredMediaId) : null,
        taxonomyService.termsForContent(post.id)
      ]);
      return {
        ...post,
        featuredMediaUrl: featuredMedia?.url ?? null,
        categories: terms.filter((term) => term.taxonomy === "category")
      };
    })
  );
}
