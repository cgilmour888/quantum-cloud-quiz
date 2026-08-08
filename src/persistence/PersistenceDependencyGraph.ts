/**
 * Artifact ID: QCQ-PER-013
 * Artifact Name: PersistenceDependencyGraph
 * Repository Path: QCQ/frontend/src/persistence/PersistenceDependencyGraph.ts
 */

export interface PersistenceDependencyNode {
  readonly artifactId: string;
  readonly dependencies: readonly string[];
}

export interface PersistenceDependencyReport {
  readonly valid: boolean;
  readonly missingDependencies: readonly string[];
  readonly cycles: readonly (readonly string[])[];
  readonly topologicalOrder: readonly string[];
}

export class PersistenceDependencyGraph {
  private readonly nodes = new Map<string, PersistenceDependencyNode>();

  public register(node: PersistenceDependencyNode): void {
    if (this.nodes.has(node.artifactId)) {
      throw new Error(`Dependency node already registered: ${node.artifactId}`);
    }
    this.nodes.set(
      node.artifactId,
      Object.freeze({
        artifactId: node.artifactId,
        dependencies: Object.freeze([...new Set(node.dependencies)]),
      }),
    );
  }

  public registerMany(nodes: readonly PersistenceDependencyNode[]): void {
    for (const node of nodes) this.register(node);
  }

  public getNode(artifactId: string): PersistenceDependencyNode | null {
    return this.nodes.get(artifactId) ?? null;
  }

  public dependentsOf(artifactId: string): readonly string[] {
    return Object.freeze(
      [...this.nodes.values()]
        .filter((node) => node.dependencies.includes(artifactId))
        .map((node) => node.artifactId)
        .sort(),
    );
  }

  public validate(externalArtifactIds: readonly string[] = []): PersistenceDependencyReport {
    const known = new Set<string>([...this.nodes.keys(), ...externalArtifactIds]);
    const missing = new Set<string>();
    for (const node of this.nodes.values()) {
      for (const dependency of node.dependencies) {
        if (!known.has(dependency)) missing.add(`${node.artifactId}->${dependency}`);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const stack: string[] = [];
    const cycles: string[][] = [];
    const order: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        const index = stack.indexOf(id);
        cycles.push([...stack.slice(index), id]);
        return;
      }
      const node = this.nodes.get(id);
      if (!node) return;
      visiting.add(id);
      stack.push(id);
      for (const dependency of node.dependencies) {
        if (this.nodes.has(dependency)) visit(dependency);
      }
      stack.pop();
      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    for (const id of [...this.nodes.keys()].sort()) visit(id);

    return Object.freeze({
      valid: missing.size === 0 && cycles.length === 0,
      missingDependencies: Object.freeze([...missing].sort()),
      cycles: Object.freeze(cycles.map((cycle) => Object.freeze(cycle))),
      topologicalOrder: Object.freeze(order),
    });
  }
}
