// Canonical block document types live in @selftaught/core/shared (packages/core/src/shared/content-doc.ts)
// so that packages/core never has to depend on packages/blocks — the dependency
// direction is strictly blocks -> core. Re-exported here so editor/registry/render
// code in this package can `import type { BlockNode, ContentDocument } from "./schema"`.
export type { BlockMark, BlockNode, ContentDocument } from "@selftaught/core";
export { EMPTY_DOCUMENT, contentDocumentSchema } from "@selftaught/core";
