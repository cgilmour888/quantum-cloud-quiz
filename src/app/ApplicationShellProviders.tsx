/**
 * Artifact ID: QCQ-APP-001-011
 * Artifact Name: ApplicationShellProviders
 * Artifact Purpose: Deterministic provider composition for analytics, AI, organizations, persistence, gamification, leaderboards, SaaS, and future platform contexts without owning their domain state.
 * Artifact Layer: Phase 1 — Application Shell / PRV
 * Artifact Dependencies: QCQ-APP-001-005, QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-017
 * Dependency Graph: typed provider descriptors -> ApplicationShellProviders -> ApplicationShell composition
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellProviders.tsx
 */

import {
  Fragment,
  createElement,
  type ReactNode,
} from 'react';

import {
  APPLICATION_SHELL_REFERENCE,
} from './ApplicationShell.constants';
import type {
  ApplicationShellProviderDescriptor,
} from './ApplicationShell.types';

export interface ApplicationShellProvidersProps {
  readonly providers:
    readonly ApplicationShellProviderDescriptor[];
  readonly children: ReactNode;
  readonly maximumDepth?: number | undefined;
}

function validateProviders(
  providers:
    readonly ApplicationShellProviderDescriptor[],
  maximumDepth: number,
): readonly ApplicationShellProviderDescriptor[] {
  if (providers.length > maximumDepth) {
    throw new Error(
      `Application Shell provider depth ${providers.length} exceeds ${maximumDepth}.`,
    );
  }

  const ids = providers.map((provider) => provider.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(
      'Application Shell provider IDs must be unique.',
    );
  }

  const enabledIds = new Set(
    providers
      .filter((provider) => provider.enabled)
      .map((provider) => provider.id),
  );

  for (const provider of providers) {
    if (!provider.enabled) continue;
    const missing = provider.dependencies.filter(
      (dependency) => !enabledIds.has(dependency),
    );
    if (provider.required && missing.length > 0) {
      throw new Error(
        `Required provider ${provider.id} is missing dependencies: ${missing.join(', ')}.`,
      );
    }
  }

  return Object.freeze(
    [...providers]
      .filter((provider) => provider.enabled)
      .sort((left, right) => {
        const priority =
          left.priority - right.priority;
        return priority !== 0
          ? priority
          : left.id.localeCompare(right.id);
      }),
  );
}

export function ApplicationShellProviders({
  providers,
  children,
  maximumDepth =
    APPLICATION_SHELL_REFERENCE.maximumProviderDepth,
}: ApplicationShellProvidersProps) {
  if (
    !Number.isInteger(maximumDepth) ||
    maximumDepth < 0 ||
    maximumDepth >
      APPLICATION_SHELL_REFERENCE.maximumProviderDepth
  ) {
    throw new Error(
      'Application Shell maximum provider depth is invalid.',
    );
  }

  const ordered = validateProviders(
    providers,
    maximumDepth,
  );

  return ordered.reduceRight<ReactNode>(
    (node, provider) =>
      createElement(
        provider.component,
        {
          key: provider.id,
          children: node,
        },
      ),
    createElement(Fragment, null, children),
  );
}

export default ApplicationShellProviders;
