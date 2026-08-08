/**
 * Artifact ID: QCQ-APP-001-017
 * Artifact Name: ApplicationShellIntegrationValidation
 * Artifact Purpose: Integration validation for provider composition, router delegation, policy authority discovery, boundary recovery, and APP-002/MasterTabletComposer ownership.
 * Artifact Layer: Phase 1 — Application Shell / INT
 * Artifact Dependencies: QCQ-APP-001-001, QCQ-APP-001-009 through QCQ-APP-001-016, QCQ-APP-002, QCQ-TBL-040
 * Artifact Dependents: Phase 18 launch proof, Phase 19 integration reconciliation
 * Dependency Graph: full Application Shell authority set + canonical external authorities -> ApplicationShellIntegrationValidation -> launch certification
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellIntegration.test.tsx
 */

import {
  createContext,
  useContext,
} from 'react';
import {
  act,
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
import {} from './ApplicationShellRouter';
import {
  navigateApplicationShell,
} from './ApplicationShellNavigation';
import type {
  ApplicationShellProviderProps,
} from './ApplicationShell.types';

const ProviderContext =
  createContext<string>('unavailable');

function RuntimeProvider({
  children,
}: ApplicationShellProviderProps) {
  return (
    <ProviderContext.Provider value="available">
      {children}
    </ProviderContext.Provider>
  );
}

function RuntimeConsumer() {
  return (
    <span data-testid="provider-state">
      {useContext(ProviderContext)}
    </span>
  );
}

function integrationRegistry() {
  const registry =
    createApplicationShellRegistry();

  for (const [
    artifactId,
    name,
    version,
  ] of [
    ['QCQ-APP-002', 'LayoutEngine', '2.0.0'],
    [
      'QCQ-TBL-040',
      'MasterTabletComposer',
      '1.0.0',
    ],
    ['QCQ-TBL-036', 'DesignTokens', '1.0.0'],
    ['QCQ-THM-001', 'ColorSystem', '1.0.0'],
  ] as const) {
    registry.registerExternalAuthority(
      artifactId,
      name,
      version,
    );
  }

  return registry;
}

describe('Application Shell integration', () => {
  it('composes providers while delegating macro layout to APP-002', () => {
    render(
      <ApplicationShell
        services={{
          registry: integrationRegistry(),
        }}
        providers={[
          {
            id: 'runtime-provider',
            name: 'Runtime Provider',
            priority: 10,
            component: RuntimeProvider,
            enabled: true,
            required: true,
            dependencies: [],
          },
        ]}
        composition={
          <div
            data-qcq-layout-engine="QCQ-APP-002"
            data-qcq-master-composer="QCQ-TBL-040"
          >
            <RuntimeConsumer />
          </div>
        }
      />,
    );

    expect(
      screen.getByTestId('provider-state'),
    ).toHaveTextContent('available');
    expect(
      document.querySelector(
        '[data-qcq-layout-engine="QCQ-APP-002"]',
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(
        '[data-qcq-artifact="QCQ-APP-001-001"]',
      ),
    ).toHaveLength(1);
  });

  it('delegates browser history to an injected route resolver', () => {
    window.history.replaceState(
      null,
      '',
      '/quiz',
    );

    render(
      <ApplicationShell
        services={{
          registry: integrationRegistry(),
        }}
        routeResolver={(route) =>
          Object.freeze({
            node: (
              <div data-testid="route">
                {route.pathname}
              </div>
            ),
            routeId: route.pathname,
            title: 'QCQ Route',
            requiresAuthentication: false,
            requiresOrganization: false,
          })
        }
      />,
    );

    expect(
      screen.getByTestId('route'),
    ).toHaveTextContent('/quiz');

    act(() => {
      navigateApplicationShell('/analytics');
    });

    expect(
      screen.getByTestId('route'),
    ).toHaveTextContent('/analytics');
  });
});
