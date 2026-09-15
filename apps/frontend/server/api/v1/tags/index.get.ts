import { taxonomyService } from "@selftaught/core/server";

export default defineEventHandler(() => taxonomyService.listByTaxonomy("tag"));
