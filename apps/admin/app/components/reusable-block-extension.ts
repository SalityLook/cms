import { mergeAttributes, Node, VueNodeViewRenderer } from "@tiptap/vue-3";
import ReusableBlockNodeView from "./ReusableBlockNodeView.vue";

/**
 * Renders as an atom (no editable inner content, matches the synced-reference
 * model: this node's own JSON never carries the block's content, only the id
 * -- editing happens via "Edit sumber" writing directly to reusable_blocks,
 * not through this node at all).
 */
export const ReusableBlockRef = Node.create({
  name: "reusableBlockRef",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      reusableBlockId: { default: null }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="reusable-block-ref"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "reusable-block-ref" })];
  },

  addNodeView() {
    return VueNodeViewRenderer(ReusableBlockNodeView);
  }
});
