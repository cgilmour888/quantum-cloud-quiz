/**
 * Artifact ID: QCQ-TBL-024
 * Artifact Name: LevelEngine
 * Repository Path: QCQ/frontend/src/gameplay/LevelEngine.ts
 */

export interface LevelCurvePolicy {
  readonly policyVersion: string;
  readonly maximumLevel: number;
  readonly baseXP: number;
  readonly growthFactor: number;
  readonly minimumIncrementXP: number;
}

export interface LevelDefinition {
  readonly level: number;
  readonly minimumTotalXP: number;
  readonly title: string;
}

export interface LevelProgressSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly policyVersion: string;
  readonly totalXP: number;
  readonly level: number;
  readonly title: string;
  readonly minimumTotalXP: number;
  readonly nextLevel: number | null;
  readonly nextLevelMinimumTotalXP: number | null;
  readonly xpIntoLevel: number;
  readonly xpRequiredForNextLevel: number | null;
  readonly progressToNextLevel: number;
  readonly maximumLevelReached: boolean;
}

const DEFAULT_LEVEL_POLICY: LevelCurvePolicy = Object.freeze({
  policyVersion: 'qcq-level-curve-v1.0.0',
  maximumLevel: 100,
  baseXP: 100,
  growthFactor: 1.18,
  minimumIncrementXP: 25,
});

function resolvePolicy(policy: Partial<LevelCurvePolicy> | undefined): LevelCurvePolicy {
  const resolved: LevelCurvePolicy = {
    policyVersion: policy?.policyVersion?.trim() || DEFAULT_LEVEL_POLICY.policyVersion,
    maximumLevel: policy?.maximumLevel ?? DEFAULT_LEVEL_POLICY.maximumLevel,
    baseXP: policy?.baseXP ?? DEFAULT_LEVEL_POLICY.baseXP,
    growthFactor: policy?.growthFactor ?? DEFAULT_LEVEL_POLICY.growthFactor,
    minimumIncrementXP:
      policy?.minimumIncrementXP ?? DEFAULT_LEVEL_POLICY.minimumIncrementXP,
  };
  if (!Number.isInteger(resolved.maximumLevel) || resolved.maximumLevel < 1 || resolved.maximumLevel > 1000) {
    throw new Error('LevelCurvePolicy maximumLevel must be an integer from 1 through 1000.');
  }
  if (!Number.isInteger(resolved.baseXP) || resolved.baseXP < 1) {
    throw new Error('LevelCurvePolicy baseXP must be a positive integer.');
  }
  if (!Number.isFinite(resolved.growthFactor) || resolved.growthFactor < 1) {
    throw new Error('LevelCurvePolicy growthFactor must be a finite number of at least 1.');
  }
  if (!Number.isInteger(resolved.minimumIncrementXP) || resolved.minimumIncrementXP < 1) {
    throw new Error('LevelCurvePolicy minimumIncrementXP must be a positive integer.');
  }
  return Object.freeze(resolved);
}

function defaultTitle(level: number): string {
  if (level >= 90) return 'Quantum Architect';
  if (level >= 75) return 'Principal Strategist';
  if (level >= 60) return 'Cloud Vanguard';
  if (level >= 45) return 'Systems Specialist';
  if (level >= 30) return 'Certification Navigator';
  if (level >= 15) return 'Knowledge Operator';
  if (level >= 5) return 'Cloud Explorer';
  return 'Initiate';
}

export class LevelEngine {
  public static readonly defaultPolicy = DEFAULT_LEVEL_POLICY;

  private readonly policy: LevelCurvePolicy;
  private readonly definitions: readonly LevelDefinition[];

  public constructor(
    policy?: Partial<LevelCurvePolicy>,
    titleResolver: (level: number) => string = defaultTitle,
  ) {
    this.policy = resolvePolicy(policy);
    const definitions: LevelDefinition[] = [];
    let minimumTotalXP = 0;
    for (let level = 1; level <= this.policy.maximumLevel; level += 1) {
      definitions.push(
        Object.freeze({
          level,
          minimumTotalXP,
          title: titleResolver(level).trim() || `Level ${level}`,
        }),
      );
      const increment = Math.max(
        this.policy.minimumIncrementXP,
        Math.round(
          this.policy.baseXP * Math.pow(this.policy.growthFactor, level - 1),
        ),
      );
      minimumTotalXP += increment;
    }
    this.definitions = Object.freeze(definitions);
  }

  public getDefinitions(): readonly LevelDefinition[] {
    return this.definitions;
  }

  public calculate(totalXP: number): LevelProgressSnapshot {
    if (!Number.isInteger(totalXP) || totalXP < 0) {
      throw new Error('LevelEngine totalXP must be a non-negative integer.');
    }
    let current = this.definitions[0]!;
    for (const definition of this.definitions) {
      if (definition.minimumTotalXP > totalXP) break;
      current = definition;
    }
    const next = this.definitions[current.level] ?? null;
    const xpIntoLevel = totalXP - current.minimumTotalXP;
    const xpRequiredForNextLevel = next
      ? next.minimumTotalXP - current.minimumTotalXP
      : null;
    const progressToNextLevel = next && xpRequiredForNextLevel
      ? Math.min(1, Math.max(0, xpIntoLevel / xpRequiredForNextLevel))
      : 1;

    return Object.freeze({
      schemaVersion: '1.0.0',
      policyVersion: this.policy.policyVersion,
      totalXP,
      level: current.level,
      title: current.title,
      minimumTotalXP: current.minimumTotalXP,
      nextLevel: next?.level ?? null,
      nextLevelMinimumTotalXP: next?.minimumTotalXP ?? null,
      xpIntoLevel,
      xpRequiredForNextLevel,
      progressToNextLevel,
      maximumLevelReached: next === null,
    });
  }

  public minimumXPForLevel(level: number): number {
    if (!Number.isInteger(level) || level < 1 || level > this.definitions.length) {
      throw new Error(`Level must be between 1 and ${this.definitions.length}.`);
    }
    return this.definitions[level - 1]!.minimumTotalXP;
  }
}
