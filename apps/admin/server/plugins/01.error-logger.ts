import { logger } from "@selftaught/core/server";

/**
 * Every error thrown out of a route handler -- whether it's a raw Error or
 * one already mapped to a status code by defineApiHandler's createError()
 * (createError still propagates through this same Nitro hook, it doesn't
 * bypass it) -- lands here exactly once. Structured JSON to stdout, which
 * pm2 already captures and rotates (see logger.ts for why no transport is
 * configured here).
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
