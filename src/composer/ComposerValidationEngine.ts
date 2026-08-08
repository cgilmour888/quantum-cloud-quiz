/**
 * Artifact ID: QCQ-CMP-007
 * Artifact Name: ComposerValidationEngine
 * Repository Path: QCQ/frontend/src/composer/ComposerValidationEngine.ts
 */

import {
  COMPOSER_LIMITS,
  COMPOSER_REQUIRED_ZONES,
  COMPOSER_VERSION,
  isComposerZoneId,
} from './ComposerConstants';
import {
  ComposerDependencyGraph,
  isVersionCompatible,
} from './ComposerDependencyGraph';
import type {
  ComposerConfig,
  ComposerManifest,
  ComposerRegistryLike,
  ComposerRuntimeSnapshot,
  ComposerValidationIssue,
  ComposerValidationReport,
  ComposerValidationSeverity,
} from './ComposerTypes';

export class ComposerValidationError extends Error {
  public constructor(
    message: string,
    public readonly report: ComposerValidationReport,
  ) {
    super(message);
    this.name = 'ComposerValidationError';
  }
}

function createIssue(
  severity: ComposerValidationSeverity,
  code: string,
  path: string,
  message: string,
  artifactId: string | null = null,
): ComposerValidationIssue {
  return Object.freeze({
    severity,
    code,
    path,
    message,
    artifactId,
  });
}

function report(
  issues: readonly ComposerValidationIssue[],
  manifestEntryCount: number,
  registeredModuleCount: number,
): ComposerValidationReport {
  const boundedIssues = Object.freeze(
    issues.slice(0, COMPOSER_LIMITS.maximumValidationIssues),
  );
  const fatal = boundedIssues.some(
    (issue) => issue.severity === 'critical',
  );
  const valid = !boundedIssues.some(
    (issue) =>
      issue.severity === 'error' ||
      issue.severity === 'critical',
  );
  return Object.freeze({
    valid,
    fatal,
    issues: boundedIssues,
    validatedAt: new Date().toISOString(),
    manifestEntryCount,
    registeredModuleCount,
  });
}

export class ComposerValidationEngine {
  public validate(
    manifest: ComposerManifest,
    registry: ComposerRegistryLike,
    config: ComposerConfig,
    runtime?: ComposerRuntimeSnapshot,
  ): ComposerValidationReport {
    const issues: ComposerValidationIssue[] = [];
    const artifactIds = new Set<string>();

    const schemaVersion: string =
      manifest.schemaVersion;

    if (schemaVersion !== '1.0.0') {
      issues.push(
        createIssue(
          'critical',
          'COMPOSER_MANIFEST_SCHEMA_UNSUPPORTED',
          'manifest.schemaVersion',
          `Unsupported composer manifest schema ${schemaVersion}.`,
        ),
      );
    }

    for (const manifestEntry of manifest.entries) {
      if (artifactIds.has(manifestEntry.artifactId)) {
        issues.push(
          createIssue(
            'critical',
            'COMPOSER_MANIFEST_DUPLICATE_ARTIFACT',
            'manifest.entries',
            `Duplicate artifact ${manifestEntry.artifactId}.`,
            manifestEntry.artifactId,
          ),
        );
      }
      artifactIds.add(manifestEntry.artifactId);

      if (
        !isVersionCompatible(
          COMPOSER_VERSION,
          manifestEntry.compatibility.minimumVersion,
          manifestEntry.compatibility.maximumVersion,
        )
      ) {
        issues.push(
          createIssue(
            manifestEntry.required ? 'error' : 'warning',
            'COMPOSER_MANIFEST_VERSION_INCOMPATIBLE',
            `manifest.entries.${manifestEntry.artifactId}.compatibility`,
            `${manifestEntry.artifactId} is incompatible with composer ${COMPOSER_VERSION}.`,
            manifestEntry.artifactId,
          ),
        );
      }

      if (
        manifestEntry.zone !== null &&
        !isComposerZoneId(manifestEntry.zone)
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_MANIFEST_ZONE_INVALID',
            `manifest.entries.${manifestEntry.artifactId}.zone`,
            `Unknown zone ${String(manifestEntry.zone)}.`,
            manifestEntry.artifactId,
          ),
        );
      }

      if (
        manifestEntry.required &&
        config.validation.requireRegisteredBuiltins &&
        manifestEntry.registration === 'builtin' &&
        !registry.has(manifestEntry.artifactId)
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_REQUIRED_MODULE_UNREGISTERED',
            `registry.${manifestEntry.artifactId}`,
            `Required builtin ${manifestEntry.artifactId} is not registered.`,
            manifestEntry.artifactId,
          ),
        );
      }
    }

    try {
      const graph = new ComposerDependencyGraph(manifest);
      const analysis = graph.analyze();
      for (const missing of analysis.missingDependencies) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_DEPENDENCY_MISSING',
            `manifest.entries.${missing.artifactId}.dependencies`,
            `${missing.artifactId} requires missing artifact ${missing.dependencyId}.`,
            missing.artifactId,
          ),
        );
      }
      for (const cycle of analysis.cycles) {
        issues.push(
          createIssue(
            'critical',
            'COMPOSER_DEPENDENCY_CYCLE',
            'manifest.entries',
            `Dependency cycle: ${cycle.path.join(' -> ')}.`,
          ),
        );
      }
    } catch (error) {
      issues.push(
        createIssue(
          'critical',
          'COMPOSER_DEPENDENCY_ANALYSIS_FAILED',
          'manifest.entries',
          error instanceof Error
            ? error.message
            : 'Dependency analysis failed.',
        ),
      );
    }

    for (const zone of COMPOSER_REQUIRED_ZONES) {
      if (!config.activeZones.includes(zone)) {
        issues.push(
          createIssue(
            'critical',
            'COMPOSER_REQUIRED_ZONE_DISABLED',
            'config.activeZones',
            `Required zone ${zone} is disabled.`,
          ),
        );
      }
    }

    if (
      config.accessibility.minimumTargetSizePx <
      COMPOSER_LIMITS.minimumTargetSizePx
    ) {
      issues.push(
        createIssue(
          'error',
          'COMPOSER_TARGET_SIZE_TOO_SMALL',
          'config.accessibility.minimumTargetSizePx',
          `Minimum target size must be at least ${COMPOSER_LIMITS.minimumTargetSizePx}px.`,
        ),
      );
    }

    if (
      config.accessibility.textScale <
        COMPOSER_LIMITS.minimumTextScale ||
      config.accessibility.textScale >
        COMPOSER_LIMITS.maximumTextScale
    ) {
      issues.push(
        createIssue(
          'error',
          'COMPOSER_TEXT_SCALE_INVALID',
          'config.accessibility.textScale',
          `Text scale must remain between ${COMPOSER_LIMITS.minimumTextScale} and ${COMPOSER_LIMITS.maximumTextScale}.`,
        ),
      );
    }

    for (const registryIssue of registry
      .getSnapshot()
      .artifactIds.length > COMPOSER_LIMITS.maximumRegistryModules
      ? ['Registry exceeds the configured maximum module count.']
      : []) {
      issues.push(
        createIssue(
          'critical',
          'COMPOSER_REGISTRY_CAPACITY_EXCEEDED',
          'registry',
          registryIssue,
        ),
      );
    }

    if (runtime !== undefined) {
      if (
        runtime.totalQuestions < 0 ||
        !Number.isInteger(runtime.totalQuestions)
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_RUNTIME_TOTAL_INVALID',
            'runtime.totalQuestions',
            'Total question count must be a non-negative integer.',
          ),
        );
      }
      if (
        runtime.question !== null &&
        (
          runtime.questionIndex < 0 ||
          runtime.questionIndex >= runtime.totalQuestions
        )
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_RUNTIME_INDEX_INVALID',
            'runtime.questionIndex',
            'Question index is outside the active question sequence.',
          ),
        );
      }
      if (
        runtime.question === null &&
        runtime.totalQuestions > 0 &&
        runtime.lifecycle === 'ready'
      ) {
        issues.push(
          createIssue(
            'warning',
            'COMPOSER_RUNTIME_QUESTION_MISSING',
            'runtime.question',
            'A ready runtime with questions has no active question.',
          ),
        );
      }
      if (
        runtime.answeredCount < 0 ||
        runtime.answeredCount > runtime.totalQuestions
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_RUNTIME_ANSWERED_INVALID',
            'runtime.answeredCount',
            'Answered count is outside the question sequence.',
          ),
        );
      }
      if (
        runtime.flaggedCount < 0 ||
        runtime.flaggedCount > runtime.totalQuestions
      ) {
        issues.push(
          createIssue(
            'error',
            'COMPOSER_RUNTIME_FLAGGED_INVALID',
            'runtime.flaggedCount',
            'Flagged count is outside the question sequence.',
          ),
        );
      }
    }

    const result = report(
      issues,
      manifest.entries.length,
      registry.getSnapshot().artifactIds.length,
    );

    if (
      config.validation.rejectWarnings &&
      result.issues.some(
        (issue) => issue.severity === 'warning',
      )
    ) {
      return report(
        [
          ...result.issues,
          createIssue(
            'error',
            'COMPOSER_WARNING_REJECTED',
            'config.validation.rejectWarnings',
            'Warnings are rejected by the active validation policy.',
          ),
        ],
        manifest.entries.length,
        registry.getSnapshot().artifactIds.length,
      );
    }

    return result;
  }

  public assertValid(
    manifest: ComposerManifest,
    registry: ComposerRegistryLike,
    config: ComposerConfig,
    runtime?: ComposerRuntimeSnapshot,
  ): ComposerValidationReport {
    const validation = this.validate(
      manifest,
      registry,
      config,
      runtime,
    );
    if (!validation.valid) {
      throw new ComposerValidationError(
        'QCQ master composition validation failed.',
        validation,
      );
    }
    return validation;
  }
}

export const composerValidationEngine =
  new ComposerValidationEngine();
