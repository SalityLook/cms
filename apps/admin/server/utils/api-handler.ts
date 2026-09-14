import { CapabilityError, NotFoundError, TransitionError, ValidationError } from "@selftaught/core/server";
import type { H3Event } from "h3";

/**
 * Wraps defineEventHandler, mapping core's domain error classes to the
 * precise HTTP status code they mean instead of the generic 500 h3 gives
 * any thrown Error by default. Use this instead of defineEventHandler for
 * any route that calls into a service method which can throw one of these
 * (mainly content/media write operations) — see CLAUDE.md's note on
 * "Custom error classes" for the history of why this exists.
 */
export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      if (error instanceof CapabilityError) {
        throw createError({ statusCode: 403, statusMessage: error.message });
      }
      if (error instanceof NotFoundError) {
        throw createError({ statusCode: 404, statusMessage: error.message });
      }
      if (error instanceof TransitionError) {
        throw createError({ statusCode: 409, statusMessage: error.message });
      }
      if (error instanceof ValidationError) {
        throw createError({ statusCode: 400, statusMessage: error.message });
      }
      throw error;
    }
  });
}
