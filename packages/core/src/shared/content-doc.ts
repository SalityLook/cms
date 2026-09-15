import { z } from "zod";

/**
 * Canonical block document shape — ProseMirror-compatible node JSON, stored
 * directly as `content.content` (jsonb). Defined here (not in @selftaught/blocks)
 * so packages/core never has to depend on packages/blocks: blocks depends on
 * core, not the other way around. @selftaught/blocks re-exports these types
 * and builds the Tiptap editor / Vue render registry around them.
 */
export interface BlockMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface BlockNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlockNode[];
  text?: string;
  marks?: BlockMark[];
}

export interface ContentDocument {
  version: 1;
  type: "doc";
  content: BlockNode[];
}

export const EMPTY_DOCUMENT: ContentDocument = { version: 1, type: "doc", content: [] };

export const blockMarkSchema: z.ZodType<BlockMark> = z.object({
  type: z.string(),
  attrs: z.record(z.string(), z.unknown()).optional()
});

export const blockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(blockNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(blockMarkSchema).optional()
  })
);

export const contentDocumentSchema = z.object({
  version: z.literal(1),
  type: z.literal("doc"),
  content: z.array(blockNodeSchema)
});

/** Walks the block tree and concatenates every text node -- used to build the plain-text search index (Phase 15) and revision diffs (Phase 18). */
export function extractPlainText(doc: ContentDocument): string {
  const parts: string[] = [];
  function walk(nodes: BlockNode[]) {
    for (const node of nodes) {
      if (node.text) parts.push(node.text);
      if (node.content) walk(node.content);
    }
  }
  walk(doc.content);
  return parts.join(" ");
}

/** Collects every reusableBlockId referenced anywhere in the tree (deduped) -- used by ContentService to keep reusable_block_usages in sync on every save (Phase 17). */
export function extractReusableBlockRefs(doc: ContentDocument): string[] {
  const ids = new Set<string>();
  function walk(nodes: BlockNode[]) {
    for (const node of nodes) {
      if (node.type === "reusableBlockRef" && typeof node.attrs?.reusableBlockId === "string") {
        ids.add(node.attrs.reusableBlockId);
      }
      if (node.content) walk(node.content);
    }
  }
  walk(doc.content);
  return [...ids];
}
