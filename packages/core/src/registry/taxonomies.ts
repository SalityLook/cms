export interface TaxonomyDefinition {
  key: string;
  label: string;
  appliesTo: readonly string[];
  hierarchical?: boolean;
}

class TaxonomyRegistryImpl {
  private readonly taxonomies = new Map<string, TaxonomyDefinition>();

  register(definition: TaxonomyDefinition) {
    this.taxonomies.set(definition.key, definition);
  }

  get(key: string): TaxonomyDefinition | undefined {
    return this.taxonomies.get(key);
  }

  list(): TaxonomyDefinition[] {
    return [...this.taxonomies.values()];
  }
}

export const taxonomyRegistry = new TaxonomyRegistryImpl();

taxonomyRegistry.register({ key: "category", label: "Category", appliesTo: ["post"], hierarchical: true });
taxonomyRegistry.register({ key: "tag", label: "Tag", appliesTo: ["post"], hierarchical: false });
