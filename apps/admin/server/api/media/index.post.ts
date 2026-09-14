import { mediaService } from "@selftaught/core/server";

// Belt-and-suspenders: reject an oversized body via Content-Length BEFORE
// reading it fully into memory. MediaService.upload() also enforces this
// limit, but only after readMultipartFormData() has already buffered the
// whole request — this header check is the actual first line of defense
// against someone sending a huge payload just to exhaust memory. The real
// hard limit for a self-hosted deployment should still be enforced one
// layer up too (e.g. `client_max_body_size` on the reverse proxy — see
// README's deployment section).
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // keep in sync with MediaService

export default defineApiHandler(async (event) => {
  const actor = requireCapability(event, "manage_media");

  const contentLength = Number(getRequestHeader(event, "content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE_BYTES + 1024) {
    // +1KB slack for multipart boundary/headers overhead around the file itself.
    throw createError({ statusCode: 413, statusMessage: "File too large" });
  }

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((part) => part.name === "file" && part.filename);
  if (!filePart?.filename) {
    throw createError({ statusCode: 400, statusMessage: "Missing file" });
  }

  return mediaService.upload({
    fileName: filePart.filename,
    mimeType: filePart.type ?? "application/octet-stream",
    data: filePart.data,
    uploadedById: actor.id
  });
});
