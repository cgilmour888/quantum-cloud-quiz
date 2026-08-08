/**
 * Artifact ID: QCQ-APP-001-010
 * Artifact Name: ApplicationShellPolicies
 * Artifact Purpose: Runtime policy authority enforcing immutable APP-002 macro-layout ownership, MasterTabletComposer ownership, Phase 9 visual authority, accessibility, connectivity, and registry integrity.
 * Artifact Layer: Phase 1 — Application Shell / POL
 * Artifact Dependencies: QCQ-APP-001-004, QCQ-APP-001-005, QCQ-APP-001-006, QCQ-APP-001-008, QCQ-APP-001-009
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-017
 * Dependency Graph: configuration + registry + runtime/accessibility -> ApplicationShellPolicies -> shell status
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellPolicies.ts
 */

import {
  APPLICATION_SHELL_EXTERNAL_AUTHORITIES,
  APPLICATION_SHELL_VISUAL_AUTHORITIES,
} from './ApplicationShell.constants';
import type {
  ApplicationShellAccessibilitySnapshot,
  ApplicationShellConfig,
  ApplicationShellHealthSnapshot,
  ApplicationShellPolicyIssue,
  ApplicationShellPolicyReport,
  ApplicationShellRegistrySnapshot,
} from './ApplicationShell.types';

export interface ApplicationShellPolicyInput {
  readonly config: ApplicationShellConfig;
  readonly registry: ApplicationShellRegistrySnapshot;
  readonly health: ApplicationShellHealthSnapshot;
  readonly accessibility:
    ApplicationShellAccessibilitySnapshot;
  readonly evaluatedAt?: string | undefined;
}

export class ApplicationShellPolicies {
  public evaluate(
    input: ApplicationShellPolicyInput,
  ): ApplicationShellPolicyReport {
    const evaluatedAt =
      input.evaluatedAt ?? new Date().toISOString();
    const issues: ApplicationShellPolicyIssue[] = [];
    const missingAuthorities: string[] = [];
    const verifiedAuthorities: string[] = [];

    const add = (
      severity: ApplicationShellPolicyIssue['severity'],
      code: string,
      message: string,
      remediation: string,
      artifactId: string | null,
    ): void => {
      issues.push(Object.freeze({
        severity,
        code,
        message,
        remediation,
        artifactId,
      }));
    };

    const requiredAuthorities = [
      ...(input.config.requireLayoutAuthority
        ? ['QCQ-APP-002']
        : []),
      ...(input.config.requireMasterComposer
        ? ['QCQ-TBL-040']
        : []),
      ...(input.config.requireVisualAuthorities
        ? APPLICATION_SHELL_EXTERNAL_AUTHORITIES.filter(
            (artifactId) =>
              artifactId === 'QCQ-TBL-036' ||
              artifactId === 'QCQ-THM-001',
          )
        : []),
    ];

    for (const artifactId of requiredAuthorities) {
      if (
        input.registry.enabledArtifactIds.includes(
          artifactId,
        )
      ) {
        verifiedAuthorities.push(artifactId);
      } else {
        missingAuthorities.push(artifactId);
        add(
          'error',
          'shell-authority-missing',
          `Required authority ${artifactId} is not enabled in the shell registry.`,
          'Register the exact permanent authority before declaring the Application Shell ready.',
          artifactId,
        );
      }
    }

    if (input.config.requireVisualAuthorities) {
      const registeredVisualAuthorities =
        APPLICATION_SHELL_VISUAL_AUTHORITIES.filter(
          (artifactId) =>
            input.registry.enabledArtifactIds.includes(
              artifactId,
            ),
        );
      if (registeredVisualAuthorities.length === 0) {
        add(
          'error',
          'shell-visual-authority-missing',
          'No Phase 9 visual authority is registered.',
          'Register DesignTokens/Theme authorities and keep ApplicationShell.module.css a consumer rather than an independent design system.',
          'QCQ-TBL-036',
        );
      }
    }

    if (
      input.config.requireOnlineForBoot &&
      !input.health.online
    ) {
      add(
        'error',
        'shell-online-required',
        'Boot policy requires network connectivity.',
        'Restore connectivity or change environment policy through governed configuration.',
        null,
      );
    } else if (
      !input.health.online &&
      !input.config.allowDegradedOffline
    ) {
      add(
        'error',
        'shell-offline-prohibited',
        'Offline execution is disabled by shell policy.',
        'Restore connectivity before continuing.',
        null,
      );
    } else if (!input.health.online) {
      add(
        'warning',
        'shell-offline-degraded',
        'The shell is operating offline.',
        'Continue only with locally available certification/persistence capabilities.',
        null,
      );
    }

    if (
      input.config.requireReducedMotionCompliance &&
      input.accessibility.motion === 'reduced'
    ) {
      verifiedAuthorities.push(
        'accessibility:reduced-motion',
      );
    }

    if (
      input.config.requireForcedColorsCompliance &&
      input.accessibility.contrast ===
        'forced-colors'
    ) {
      verifiedAuthorities.push(
        'accessibility:forced-colors',
      );
    }

    if (input.health.status === 'critical') {
      add(
        'critical',
        'shell-health-critical',
        'Application Shell health is critical.',
        'Isolate the fault and restore required platform authorities before resuming normal operation.',
        null,
      );
    } else if (input.health.status === 'degraded') {
      add(
        'warning',
        'shell-health-degraded',
        'Application Shell health is degraded.',
        'Review health warnings while preserving certification progress.',
        null,
      );
    }

    const critical = issues.some(
      (issue) => issue.severity === 'critical',
    );
    const errors = issues.filter(
      (issue) => issue.severity === 'error',
    ).length;
    const warnings = issues.filter(
      (issue) => issue.severity === 'warning',
    ).length;

    const status =
      critical || errors > 0
        ? 'degraded'
        : warnings > 0
          ? 'degraded'
          : 'ready';

    const denominator = Math.max(
      8,
      requiredAuthorities.length + 4,
    );
    const score = Math.max(
      0,
      1 -
        (
          errors * 2 +
          warnings +
          Number(critical) * 4
        ) /
          denominator,
    );

    return Object.freeze({
      valid: !critical && errors === 0,
      status,
      score,
      issues: Object.freeze(issues),
      verifiedAuthorities: Object.freeze(
        [...new Set(verifiedAuthorities)].sort(),
      ),
      missingAuthorities: Object.freeze(
        [...new Set(missingAuthorities)].sort(),
      ),
      evaluatedAt,
    });
  }
}
