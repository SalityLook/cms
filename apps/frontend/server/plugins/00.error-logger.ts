import { logger } from "@selftaught/core/server";

/**
 * apps/frontend has no defineApiHandler equivalent (routes map domain
 * errors to status codes inline, see e.g. server/api/comments.post.ts) --
 * this Nitro-level hook catches every error regardless, without needing
 * to touch any individual route file. Same posture as
 * apps/admin/server/plugins/01.error-logger.ts.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", (error, { event }) => {
    logger.error(
      {
        method: event?.method,
        path: event?.path,
        statusCode: (error as { statusCode?: number }).statusCode,
        err: error
      },
      error.message
    );
  });
});
