import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

const mediaRoot = resolve(process.env.MEDIA_LOCAL_PATH ?? "../../data/media");

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "path");
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "Missing path" });
  }

  const filePath = resolve(mediaRoot, path);
  if (filePath !== mediaRoot && !filePath.startsWith(mediaRoot + sep)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid path" });
  }

  try {
    await stat(filePath);
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  return sendStream(event, createReadStream(filePath));
});
