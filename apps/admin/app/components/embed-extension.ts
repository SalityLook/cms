import { mergeAttributes, Node, VueNodeViewRenderer } from "@tiptap/vue-3";
import EmbedNodeView from "./EmbedNodeView.vue";

/**
 * Atom node: the resolved+sanitized HTML is captured entirely in attrs at
 * insert time (see BlockEditor.vue's paste handler / toolbar action) --
 * this node never fetches anything itself, at edit time or render time.
 */
export const EmbedBlock = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
      html: { default: "" },
      providerName: { default: "" }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "embed-block" })];
  },

  addNodeView() {
    return VueNodeViewRenderer(EmbedNodeView);
  }
});
