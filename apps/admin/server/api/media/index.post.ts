import { mediaService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const actor = requireCapability(event, "manage_media");

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
