import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  AppRuntimeContext,
} from './AppRuntimeContext';

import {
  createFoundationAccessibilityRegistry,
} from '../accessibility/AccessibilityRegistry';
import {
  resolveAccessibilityPolicy,
  type AccessibilityPolicy,
} from '../accessibility/AccessibilityPolicies';
import {
  validateAccessibilityFoundation,
  type AccessibilityValidationResult,
} from '../accessibility/AccessibilityValidator';
import {
  BootstrapHealthMonitor,
  type BootstrapHealthSnapshot,
} from '../bootstrap/BootstrapHealthMonitor';
import {
  BootstrapRegistry,
  type BootstrapStepResult,
} from '../bootstrap/BootstrapRegistry';
import {
  BootstrapTelemetry,
} from '../bootstrap/BootstrapTelemetry';
import {
  runtimeConfig,
  type RuntimeConfig,
} from '../config/runtimeConfig';
import {
  ProviderRegistry,
} from '../providers/ProviderRegistry';
import {
  validateProviders,
  type ProviderValidationResult,
} from '../providers/ProviderValidationEngine';
import {
  detectRenderingCapabilities,
  type RenderingCapabilities,
} from '../rendering/RenderingCapabilities';
import {
  resolveRenderingPolicy,
  type ResolvedRenderingPolicy,
} from '../rendering/RenderingPolicies';
import {
  detectRuntimeCapabilities,
  type RuntimeCapabilities,
} from '../runtime/RuntimeCapabilities';
import {
  createFoundationRuntimeRegistry,
  type RuntimeRegistry,
} from '../runtime/RuntimeRegistry';
import {
  resolveRuntimePolicies,
  type ResolvedRuntimePolicy,
} from '../runtime/RuntimePolicies';
import {
  validateRuntime,
  type RuntimeValidationResult,
} from '../runtime/RuntimeValidationEngine';
import {
  RuntimeRecoveryEngine,
} from '../runtime/RuntimeRecoveryEngine';
import {
  evaluateRuntimeReadiness,
  type RuntimeReadinessResult,
} from '../runtime/RuntimeReadinessEvaluator';

export type AppLifecyclePhase =
  | 'bootstrapping'
  | 'ready'
  | 'degraded'
  | 'blocked';

export interface AppLifecycle {
  readonly phase: AppLifecyclePhase;
  readonly startedAt: number;
  readonly readyAt: number | null;
  readonly bootstrap:
    readonly BootstrapStepResult[];
}

export interface AppRuntimeContextValue {
  readonly config: RuntimeConfig;
  readonly lifecycle: AppLifecycle;
  readonly runtimeRegistry: RuntimeRegistry;
  readonly providerRegistry: ProviderRegistry;
  readonly runtimeCapabilities:
    RuntimeCapabilities;
  readonly runtimePolicy:
    ResolvedRuntimePolicy;
  readonly renderingCapabilities:
    RenderingCapabilities;
  readonly rendering:
    ResolvedRenderingPolicy;
  readonly accessibilityPolicy:
    AccessibilityPolicy;
  readonly runtimeValidation:
    RuntimeValidationResult | null;
  readonly accessibilityValidation:
    AccessibilityValidationResult | null;
  readonly providerValidation:
    ProviderValidationResult | null;
  readonly health:
    BootstrapHealthSnapshot;
  readonly readiness:
    RuntimeReadinessResult | null;
}

function createHealthMonitor(
  runtimeRegistry: RuntimeRegistry,
): BootstrapHealthMonitor {
  return new BootstrapHealthMonitor()
    .register(
      'runtime-registry',
      () =>
        Object.freeze({
          id: 'runtime-registry',
          state:
            runtimeRegistry.sealed &&
            runtimeRegistry.size > 0
              ? 'healthy'
              : 'unhealthy',
          checkedAt: Date.now(),
          latencyMilliseconds: 0,
          message:
            runtimeRegistry.sealed
              ? 'Runtime registry is sealed and populated.'
              : 'Runtime registry is not sealed.',
        }),
    )
    .register(
      'mount-root',
      () =>
        Object.freeze({
          id: 'mount-root',
          state:
            typeof document ===
              'undefined' ||
            document.getElementById(
              'root',
            ) !== null
              ? 'healthy'
              : 'unhealthy',
          checkedAt: Date.now(),
          latencyMilliseconds: 0,
          message:
            'Application mount-root integrity checked.',
        }),
    );
}

function createBootstrapRegistry(
  telemetry: BootstrapTelemetry,
): BootstrapRegistry {
  return new BootstrapRegistry()
    .register(
      {
        id: 'preflight.document',
        phase: 'preflight',
        criticality: 'required',
        dependencies: Object.freeze([]),
        timeoutMilliseconds: 1_500,
      },
      () => {
        if (
          typeof document !==
            'undefined' &&
          document.getElementById(
            'root',
          ) === null
        ) {
          throw new Error(
            'QCQ mount root is missing.',
          );
        }
      },
    )
    .register(
      {
        id: 'runtime.foundation',
        phase: 'runtime',
        criticality: 'required',
        dependencies: Object.freeze([
          'preflight.document',
        ]),
        timeoutMilliseconds: 2_000,
      },
      () => {
        telemetry.record({
          name: 'runtime.foundation.validated',
          level: 'info',
          durationMilliseconds: null,
          attributes: Object.freeze({
            version: '1.0.0',
          }),
        });
      },
    )
    .register(
      {
        id: 'providers.foundation',
        phase: 'providers',
        criticality: 'important',
        dependencies: Object.freeze([
          'runtime.foundation',
        ]),
        timeoutMilliseconds: 2_000,
      },
      () => undefined,
    )
    .register(
      {
        id: 'accessibility.foundation',
        phase: 'accessibility',
        criticality: 'required',
        dependencies: Object.freeze([
          'runtime.foundation',
        ]),
        timeoutMilliseconds: 2_000,
      },
      () => undefined,
    )
    .register(
      {
        id: 'rendering.foundation',
        phase: 'rendering',
        criticality: 'important',
        dependencies: Object.freeze([
          'runtime.foundation',
        ]),
        timeoutMilliseconds: 2_000,
      },
      () => undefined,
    )
    .register(
      {
        id: 'application.mount',
        phase: 'application',
        criticality: 'required',
        dependencies: Object.freeze([
          'accessibility.foundation',
          'rendering.foundation',
        ]),
        timeoutMilliseconds: 2_000,
      },
      () => undefined,
    )
    .seal();
}

export function AppProviders({
  children,
}: PropsWithChildren) {
  const [startedAt] = useState(
    () => Date.now(),
  );
  const runtimeRegistry = useMemo(
    () => createFoundationRuntimeRegistry(),
    [],
  );
  const providerRegistry = useMemo(
    () => new ProviderRegistry(),
    [],
  );
  const telemetry = useMemo(
    () => new BootstrapTelemetry(),
    [],
  );
  const healthMonitor = useMemo(
    () =>
      createHealthMonitor(
        runtimeRegistry,
      ),
    [runtimeRegistry],
  );
  const bootstrapRegistry = useMemo(
    () =>
      createBootstrapRegistry(
        telemetry,
      ),
    [telemetry],
  );
  const recoveryEngine = useMemo(
    () => new RuntimeRecoveryEngine(),
    [],
  );

  const [runtimeCapabilities] =
    useState<RuntimeCapabilities>(
      detectRuntimeCapabilities,
    );
  const [renderingCapabilities] =
    useState<RenderingCapabilities>(
      detectRenderingCapabilities,
    );

  const runtimePolicy = useMemo(
    () =>
      resolveRuntimePolicies(
        runtimeConfig,
        runtimeCapabilities,
      ),
    [runtimeCapabilities],
  );

  const rendering = useMemo(
    () =>
      resolveRenderingPolicy(
        {
          width:
            typeof window ===
            'undefined'
              ? 1280
              : window.innerWidth,
          height:
            typeof window ===
            'undefined'
              ? 720
              : window.innerHeight,
        },
        renderingCapabilities,
        runtimeConfig,
      ),
    [renderingCapabilities],
  );

  const accessibilityRegistry =
    useMemo(
      () =>
        createFoundationAccessibilityRegistry(),
      [],
    );

  const accessibilityPolicy =
    useMemo(
      () =>
        resolveAccessibilityPolicy(
          runtimeCapabilities,
        ),
      [runtimeCapabilities],
    );

  const [lifecycle, setLifecycle] =
    useState<AppLifecycle>(
      Object.freeze({
        phase: 'bootstrapping',
        startedAt,
        readyAt: null,
        bootstrap: Object.freeze([]),
      }),
    );
  const [
    runtimeValidation,
    setRuntimeValidation,
  ] =
    useState<RuntimeValidationResult | null>(
      null,
    );
  const [
    accessibilityValidation,
    setAccessibilityValidation,
  ] =
    useState<AccessibilityValidationResult | null>(
      null,
    );
  const [
    providerValidation,
    setProviderValidation,
  ] =
    useState<ProviderValidationResult | null>(
      null,
    );
  const [health, setHealth] =
    useState<BootstrapHealthSnapshot>(
      healthMonitor.snapshot(),
    );
  const [readiness, setReadiness] =
    useState<RuntimeReadinessResult | null>(
      null,
    );

  useEffect(() => {
    recoveryEngine.begin();

    const unsubscribe =
      healthMonitor.subscribe(
        setHealth,
      );

    let cancelled = false;

    const initialize =
      async (): Promise<void> => {
        const bootstrap =
          await bootstrapRegistry.executeAll();

        if (cancelled) return;

        const runtimeResult =
          validateRuntime(
            runtimeRegistry,
            runtimeCapabilities,
            runtimePolicy,
          );
        const accessibilityResult =
          validateAccessibilityFoundation(
            accessibilityRegistry.list(),
            accessibilityPolicy,
          );
        const providerResult =
          validateProviders(
            providerRegistry,
          );
        const healthResult =
          await healthMonitor.run();

        if (cancelled) return;

        const readinessResult =
          evaluateRuntimeReadiness({
            runtime: runtimeResult,
            accessibility:
              accessibilityResult,
            providers: providerResult,
            health: healthResult,
            rendering,
          });

        setRuntimeValidation(
          runtimeResult,
        );
        setAccessibilityValidation(
          accessibilityResult,
        );
        setProviderValidation(
          providerResult,
        );
        setHealth(healthResult);
        setReadiness(readinessResult);

        const phase:
          AppLifecyclePhase =
          readinessResult.state ===
          'ready'
            ? 'ready'
            : readinessResult.state ===
                'degraded'
              ? 'degraded'
              : 'blocked';

        setLifecycle(
          Object.freeze({
            phase,
            startedAt,
            readyAt:
              phase === 'blocked'
                ? null
                : Date.now(),
            bootstrap,
          }),
        );

        document.documentElement.dataset.qcqRuntime =
          phase;

        telemetry.record({
          name:
            'runtime.readiness.evaluated',
          level:
            phase === 'blocked'
              ? 'error'
              : phase === 'degraded'
                ? 'warning'
                : 'info',
          durationMilliseconds:
            Date.now() - startedAt,
          attributes: Object.freeze({
            phase,
            score:
              readinessResult.score,
          }),
        });

        if (phase !== 'blocked') {
          recoveryEngine.markReady();
        }
      };

    void initialize();

    return () => {
      cancelled = true;
      unsubscribe();
      delete document.documentElement
        .dataset.qcqRuntime;
    };
  }, [
    accessibilityPolicy,
    accessibilityRegistry,
    bootstrapRegistry,
    healthMonitor,
    providerRegistry,
    recoveryEngine,
    rendering,
    runtimeCapabilities,
    runtimePolicy,
    runtimeRegistry,
    startedAt,
    telemetry,
  ]);

  const value =
    useMemo<AppRuntimeContextValue>(
      () =>
        Object.freeze({
          config: runtimeConfig,
          lifecycle,
          runtimeRegistry,
          providerRegistry,
          runtimeCapabilities,
          runtimePolicy,
          renderingCapabilities,
          rendering,
          accessibilityPolicy,
          runtimeValidation,
          accessibilityValidation,
          providerValidation,
          health,
          readiness,
        }),
      [
        accessibilityPolicy,
        accessibilityValidation,
        health,
        lifecycle,
        providerRegistry,
        providerValidation,
        readiness,
        rendering,
        renderingCapabilities,
        runtimeCapabilities,
        runtimePolicy,
        runtimeRegistry,
        runtimeValidation,
      ],
    );

  return (
    <AppRuntimeContext.Provider
      value={value}
    >
      {children}
    </AppRuntimeContext.Provider>
  );
}
