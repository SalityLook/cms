import type { CapabilityKey } from "./capabilities";

export interface ContentTypeCapabilityMap {
  edit: CapabilityKey;
  editOthers: CapabilityKey;
  publish: CapabilityKey;
  delete: CapabilityKey;
}

export interface ContentTypeDefinition {
  key: string;
  label: string;
  supports: readonly string[];
  capabilityMap: ContentTypeCapabilityMap;
  hierarchical?: boolean;
}

class ContentTypeRegistryImpl {
  private readonly types = new Map<string, ContentTypeDefinition>();

  register(definition: ContentTypeDefinition) {
    this.types.set(definition.key, definition);
  }

  get(key: string): ContentTypeDefinition | undefined {
    return this.types.get(key);
  }

  list(): ContentTypeDefinition[] {
    return [...this.types.values()];
  }
}

export const contentTypeRegistry = new ContentTypeRegistryImpl();

contentTypeRegistry.register({
  key: "post",
  label: "Post",
  supports: ["title", "editor", "excerpt", "thumbnail", "categories", "tags"],
  capabilityMap: {
    edit: "edit_posts",
    editOthers: "edit_others_posts",
    publish: "publish_posts",
    delete: "delete_posts"
  },
  hierarchical: false
});

contentTypeRegistry.register({
  key: "page",
  label: "Page",
  supports: ["title", "editor", "thumbnail"],
  capabilityMap: {
    edit: "edit_pages",
    editOthers: "edit_pages",
    publish: "edit_pages",
    delete: "edit_pages"
  },
  hierarchical: true
});
