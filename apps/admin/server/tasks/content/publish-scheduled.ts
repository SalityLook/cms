import { contentService } from "@selftaught/core/server";

export default defineTask({
  meta: {
    name: "content:publish-scheduled",
    description: "Publish content whose scheduledAt has passed"
  },
  async run() {
    const published = await contentService.publishDueScheduled();
    return { result: { publishedCount: published.length } };
  }
});
