/**
 * Artifact ID: QCQ-APP-001-012
 * Artifact Name: ApplicationShellRouter
 * Artifact Purpose: Browser-history navigation adapter that delegates route ownership to an injected resolver and never duplicates the canonical AppRouter route table.
 * Artifact Layer: Phase 1 — Application Shell / NAV
 * Artifact Dependencies: QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-017
 * Dependency Graph: browser location + injected route resolver -> ApplicationShellRouter -> shell composition
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellRouter.tsx
 */

import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type {
  ApplicationShellRoute,
  ApplicationShellRouteResolver,
  ApplicationShellRouteResult,
} from './ApplicationShell.types';
import {
  applicationShellLocationKey,
  subscribeApplicationShellLocation,
} from './ApplicationShellNavigation';

function normalizePath(
  pathname: string,
  basePath: string,
): string {
  const normalizedBase =
    basePath === '/'
      ? ''
      : basePath.replace(/\/+$/u, '');
  if (
    normalizedBase.length > 0 &&
    pathname.startsWith(normalizedBase)
  ) {
    return pathname.slice(normalizedBase.length) || '/';
  }
  return pathname || '/';
}

function currentRoute(
  basePath: string,
  navigationKey: string,
): ApplicationShellRoute {
  // The external-store snapshot is an intentional
  // route invalidation token. Browser location remains
  // the canonical source for the route fields.
  void navigationKey;
  if (typeof window === 'undefined') {
    return Object.freeze({
      path: '/',
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    });
  }

  const pathname = normalizePath(
    window.location.pathname,
    basePath,
  );
  return Object.freeze({
    path: `${pathname}${window.location.search}${window.location.hash}`,
    pathname,
    search: window.location.search,
    hash: window.location.hash,
    state:
      window.history.state as unknown,
  });
}

export interface ApplicationShellRouterProps {
  readonly resolve: ApplicationShellRouteResolver;
  readonly fallback?: ReactNode | undefined;
  readonly basePath?: string | undefined;
  readonly onRouteChange?: (
    route: ApplicationShellRoute,
    result: ApplicationShellRouteResult | null,
  ) => void;
}

export function ApplicationShellRouter({
  resolve,
  fallback = null,
  basePath = '/',
  onRouteChange,
}: ApplicationShellRouterProps) {
  const key = useSyncExternalStore(
    subscribeApplicationShellLocation,
    applicationShellLocationKey,
    () => '/',
  );

  const route = useMemo(
    () => currentRoute(basePath, key),
    [basePath, key],
  );
  const result = useMemo(
    () => resolve(route),
    [resolve, route],
  );

  useEffect(() => {
    if (
      result?.title !== null &&
      result?.title !== undefined &&
      typeof document !== 'undefined'
    ) {
      document.title = result.title;
    }
    onRouteChange?.(route, result);
  }, [onRouteChange, result, route]);

  return result?.node ?? fallback;
}

export default ApplicationShellRouter;
