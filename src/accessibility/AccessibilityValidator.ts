import {
  type AccessibilityPolicy,
} from './AccessibilityPolicies';
import {
  type AccessibilityRequirement,
} from './AccessibilityRegistry';

export interface AccessibilityValidationIssue {
  readonly requirementId: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface AccessibilityValidationResult {
  readonly valid: boolean;
  readonly checkedAt: number;
  readonly issues:
    readonly AccessibilityValidationIssue[];
}

export function validateAccessibilityFoundation(
  requirements:
    readonly AccessibilityRequirement[],
  policy: AccessibilityPolicy,
  documentRoot:
    Document | null =
    typeof document === 'undefined'
      ? null
      : document,
): AccessibilityValidationResult {
  if (documentRoot === null) {
    return Object.freeze({
      valid: true,
      checkedAt: Date.now(),
      issues: Object.freeze([]),
    });
  }

  const issues:
    AccessibilityValidationIssue[] = [];
  const requiredIds =
    new Set(
      requirements
        .filter(
          (requirement) =>
            requirement.level === 'required',
        )
        .map(
          (requirement) => requirement.id,
        ),
    );

  if (
    requiredIds.has('document-language') &&
    documentRoot.documentElement.lang.trim() ===
      ''
  ) {
    issues.push({
      requirementId: 'document-language',
      severity: 'error',
      message:
        'Document root must declare a language.',
    });
  }

  if (
    requiredIds.has('primary-main') &&
    policy.requireSinglePrimaryMain
  ) {
    const mains =
      documentRoot.querySelectorAll('main');
    if (mains.length !== 1) {
      issues.push({
        requirementId: 'primary-main',
        severity: 'error',
        message:
          `Expected one main landmark; found ${mains.length}.`,
      });
    }
  }

  if (
    requiredIds.has('skip-link') &&
    policy.requireSkipLink
  ) {
    const link =
      documentRoot.querySelector<HTMLAnchorElement>(
        'a[href^="#"].qcq-skip-link',
      );
    if (link === null) {
      issues.push({
        requirementId: 'skip-link',
        severity: 'error',
        message:
          'Foundation route must provide a skip link.',
      });
    } else {
      const targetId =
        link.getAttribute('href')?.slice(1);
      if (
        !targetId ||
        documentRoot.getElementById(
          targetId,
        ) === null
      ) {
        issues.push({
          requirementId: 'skip-link',
          severity: 'error',
          message:
            'Skip link target does not exist.',
        });
      }
    }
  }

  return Object.freeze({
    valid:
      !issues.some(
        (issue) =>
          issue.severity === 'error',
      ),
    checkedAt: Date.now(),
    issues: Object.freeze(
      issues.map(
        (issue) => Object.freeze(issue),
      ),
    ),
  });
}
