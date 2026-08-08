/**
 * Artifact ID: QCQ-APP-002-012
 * Artifact Name: LayoutBreakpointRegistry
 * Artifact Purpose: Viewport-category resolution for mobile, tablet, desktop, 4K, 8K, and 12K surfaces.
 * Artifact Layer: QCQ-APP-002 — RSP (Responsive Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutBreakpointRegistry -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/responsive
 * Source File: LayoutBreakpointRegistry.ts
 */
import type { LayoutViewportCategory } from '../types/LayoutEngine.types';

export interface LayoutBreakpointDefinition {
  readonly category: LayoutViewportCategory;
  readonly minimumWidth: number;
  readonly minimumHeight: number;
  readonly minimumAspectRatio: number;
  readonly priority: number;
}

export const DEFAULT_LAYOUT_BREAKPOINTS: readonly LayoutBreakpointDefinition[] =
  Object.freeze([
    Object.freeze({ category: 'cinematic', minimumWidth: 1920, minimumHeight: 900, minimumAspectRatio: 1.62, priority: 50 }),
    Object.freeze({ category: 'command', minimumWidth: 1180, minimumHeight: 680, minimumAspectRatio: 1.4, priority: 40 }),
    Object.freeze({ category: 'balanced', minimumWidth: 760, minimumHeight: 620, minimumAspectRatio: 0.9, priority: 30 }),
    Object.freeze({ category: 'compact', minimumWidth: 420, minimumHeight: 560, minimumAspectRatio: 0.55, priority: 20 }),
    Object.freeze({ category: 'micro', minimumWidth: 0, minimumHeight: 0, minimumAspectRatio: 0, priority: 10 }),
  ]);

export class LayoutBreakpointRegistry {
  private definitions: readonly LayoutBreakpointDefinition[];

  public constructor(definitions = DEFAULT_LAYOUT_BREAKPOINTS) {
    const categories = new Set<LayoutViewportCategory>();
    for (const definition of definitions) {
      if (categories.has(definition.category)) {
        throw new Error(`Duplicate layout breakpoint category "${definition.category}".`);
      }
      categories.add(definition.category);
    }
    this.definitions = Object.freeze([...definitions].sort((left, right) => right.priority - left.priority));
  }

  public resolve(width: number, height: number): LayoutViewportCategory {
    const ratio = width / Math.max(height, 1);
    const match = this.definitions.find((definition) =>
      width >= definition.minimumWidth &&
      height >= definition.minimumHeight &&
      ratio >= definition.minimumAspectRatio,
    );
    return match?.category ?? 'micro';
  }

  public list(): readonly LayoutBreakpointDefinition[] {
    return this.definitions;
  }
}
