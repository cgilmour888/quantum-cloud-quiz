import {
  type RuntimeModuleDescriptor,
} from './RuntimeManifest';

export interface RuntimeDependencyGraphResult {
  readonly ordered: readonly string[];
  readonly missingDependencies:
    readonly {
      readonly moduleId: string;
      readonly dependencyId: string;
    }[];
  readonly cycles: readonly (readonly string[])[];
  readonly valid: boolean;
}

export function validateRuntimeDependencyGraph(
  modules: readonly RuntimeModuleDescriptor[],
): RuntimeDependencyGraphResult {
  const moduleMap = new Map(
    modules.map((module) => [
      module.id,
      module,
    ] as const),
  );

  const missing: Array<{
    readonly moduleId: string;
    readonly dependencyId: string;
  }> = [];

  for (const module of modules) {
    for (const dependency of module.dependencies) {
      if (!moduleMap.has(dependency)) {
        missing.push({
          moduleId: module.id,
          dependencyId: dependency,
        });
      }
    }
  }

  const temporary = new Set<string>();
  const permanent = new Set<string>();
  const ordered: string[] = [];
  const cycles: string[][] = [];

  function visit(
    moduleId: string,
    stack: string[],
  ): void {
    if (permanent.has(moduleId)) return;

    if (temporary.has(moduleId)) {
      const index = stack.indexOf(moduleId);
      cycles.push([
        ...stack.slice(
          index < 0 ? 0 : index,
        ),
        moduleId,
      ]);
      return;
    }

    temporary.add(moduleId);
    stack.push(moduleId);

    const module = moduleMap.get(moduleId);
    if (module !== undefined) {
      for (
        const dependency of module.dependencies
      ) {
        if (moduleMap.has(dependency)) {
          visit(dependency, stack);
        }
      }
    }

    stack.pop();
    temporary.delete(moduleId);
    permanent.add(moduleId);
    ordered.push(moduleId);
  }

  for (const module of modules) {
    visit(module.id, []);
  }

  return Object.freeze({
    ordered: Object.freeze(ordered),
    missingDependencies:
      Object.freeze(missing),
    cycles: Object.freeze(
      cycles.map(
        (cycle) => Object.freeze(cycle),
      ),
    ),
    valid:
      missing.length === 0 &&
      cycles.length === 0,
  });
}
