import type { Component } from "vue";

export interface BlockRenderDefinition {
  type: string;
  renderComponent: Component;
}

class BlockRegistryImpl {
  private readonly renderers = new Map<string, Component>();

  register(definition: BlockRenderDefinition) {
    this.renderers.set(definition.type, definition.renderComponent);
  }

  getRenderer(type: string): Component | undefined {
    return this.renderers.get(type);
  }

  types(): string[] {
    return [...this.renderers.keys()];
  }
}

export const blockRegistry = new BlockRegistryImpl();
