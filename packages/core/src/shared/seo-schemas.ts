import { z } from "zod";

export const contentSeoInputSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ogImageMediaId: z.string().uuid().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  noindex: z.boolean().optional(),
  structuredDataOverride: z.record(z.string(), z.unknown()).nullable().optional()
});

export type ContentSeoInputPayload = z.infer<typeof contentSeoInputSchema>;
