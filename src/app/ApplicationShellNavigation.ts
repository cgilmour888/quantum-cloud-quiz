/**
 * Artifact: Application Shell Navigation Authority
 *
 * Browser-history subscription and navigation infrastructure
 * for QCQ-APP-001.
 *
 * React composition remains owned by ApplicationShellRouter.
 */

const NAVIGATION_EVENT =
  'qcq:application-navigation';

export function applicationShellLocationKey():
  string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return (
    `${window.location.pathname}` +
    `${window.location.search}` +
    `${window.location.hash}`
  );
}

export function subscribeApplicationShellLocation(
  listener: () => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(
    'popstate',
    listener,
  );

  window.addEventListener(
    'hashchange',
    listener,
  );

  window.addEventListener(
    NAVIGATION_EVENT,
    listener,
  );

  return () => {
    window.removeEventListener(
      'popstate',
      listener,
    );

    window.removeEventListener(
      'hashchange',
      listener,
    );

    window.removeEventListener(
      NAVIGATION_EVENT,
      listener,
    );
  };
}

export function navigateApplicationShell(
  path: string,
  options: {
    readonly replace?:
      | boolean
      | undefined;
    readonly state?: unknown;
  } = {},
): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!path.startsWith('/')) {
    throw new Error(
      'Application Shell navigation requires '
      + 'an absolute application path.',
    );
  }

  if (options.replace ?? false) {
    window.history.replaceState(
      options.state ?? null,
      '',
      path,
    );
  } else {
    window.history.pushState(
      options.state ?? null,
      '',
      path,
    );
  }

  window.dispatchEvent(
    new Event(NAVIGATION_EVENT),
  );
}
