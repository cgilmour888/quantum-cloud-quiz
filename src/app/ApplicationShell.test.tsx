/**
 * Artifact ID: QCQ-APP-001-003
 * Artifact Name: ApplicationShellValidation
 * Artifact Purpose: Unit validation for shell semantics, permanent identity, APP-002 ownership preservation, accessibility state, and visual implementation boundaries.
 * Artifact Layer: Phase 1 — Application Shell / VAL
 * Artifact Dependencies: QCQ-APP-001-001, QCQ-APP-001-004, QCQ-APP-001-009
 * Artifact Dependents: launch proof and integration quality gates
 * Dependency Graph: ApplicationShell implementation -> ApplicationShellValidation -> Phase 18/19 quality gates
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShell.test.tsx
 */

import {
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ApplicationShell,
} from './ApplicationShell';
import {
  createApplicationShellRegistry,
} from './ApplicationShellRegistry';

function verifiedRegistry() {
  const registry =
    createApplicationShellRegistry();
  registry.registerExternalAuthority(
    'QCQ-APP-002',
    'LayoutEngine',
    '2.0.0',
  );
  registry.registerExternalAuthority(
    'QCQ-TBL-040',
    'MasterTabletComposer',
    '1.0.0',
  );
  registry.registerExternalAuthority(
    'QCQ-TBL-036',
    'DesignTokens',
    '1.0.0',
  );
  registry.registerExternalAuthority(
    'QCQ-THM-001',
    'ColorSystem',
    '1.0.0',
  );
  return registry;
}

describe('QCQ-APP-001-001 ApplicationShell', () => {
  it('renders the canonical composition without creating a competing main landmark', () => {
    render(
      <ApplicationShell
        services={{
          registry: verifiedRegistry(),
        }}
        composition={
          <div
            data-testid="layout-authority"
            data-qcq-layout-engine="QCQ-APP-002"
          >
            Canonical APP-002 composition
          </div>
        }
      />,
    );

    const shell =
      screen.getByLabelText(
        'Quantum Certification Quest',
      );
    expect(shell).toHaveAttribute(
      'data-qcq-artifact',
      'QCQ-APP-001-001',
    );
    expect(
      screen.getByTestId('layout-authority'),
    ).toBeInTheDocument();
    expect(
      shell.querySelectorAll('main'),
    ).toHaveLength(0);
  });

  it('exposes web-native chrome without runtime image elements', () => {
    const { container } = render(
      <ApplicationShell
        services={{
          registry: verifiedRegistry(),
        }}
        composition={<div>Certification runtime</div>}
      />,
    );

    expect(
      container.querySelector(
        '[data-qcq-shell-chrome="web-native"]',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('img'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('map, area'),
    ).toHaveLength(0);
  });

  it('can suppress decorative chrome without removing application content', () => {
    const { container } = render(
      <ApplicationShell
        services={{
          registry: verifiedRegistry(),
        }}
        config={{
          enableDecorativeChrome: false,
        }}
        composition={
          <div data-testid="composition">
            Certification runtime
          </div>
        }
      />,
    );

    expect(
      container.querySelector(
        '[data-qcq-shell-chrome]',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('composition'),
    ).toBeInTheDocument();
  });
});
