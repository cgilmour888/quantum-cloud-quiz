/**
 * Artifact ID: QCQ-TBL-040
 * Artifact Name: MasterTabletComposer
 * Repository Path: QCQ/frontend/src/tablet/MasterTabletComposer.tsx
 *
 * Root composition authority for the executable QCQ certification tablet.
 * Dataset, grading, gameplay, persistence, analytics, AI, and SaaS internals
 * remain behind typed controller, registry, and bridge boundaries.
 */

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';

import LayoutEngine from '../app/LayoutEngine';
import type {
  LayoutMotionPolicy,
  LayoutQualityPolicy,
} from '../app/types/LayoutEngine.types';
import {
  BorderFrameEngine,
  type BorderFrameQuality,
} from '../frame/BorderFrameEngine';
import {
  MetricsPanel,
} from '../metrics/MetricsPanel';
import {
  StormLayer,
} from '../effects/StormLayer';
import {
  COMPOSER_ARTIFACT_IDS,
  COMPOSER_DATA_ATTRIBUTES,
  COMPOSER_DEFAULT_TEXT,
  COMPOSER_VERSION,
  COMPOSER_ZONE_ORDER,
} from '../composer/ComposerConstants';
import {
  resolveComposerConfig,
} from '../composer/ComposerConfig';
import {
  COMPOSER_MANIFEST,
} from '../composer/ComposerManifest';
import {
  ComposerValidationEngine,
  ComposerValidationError,
} from '../composer/ComposerValidationEngine';
import {
  createComposerAccessibilityEngine,
} from '../composer/ComposerAccessibilityEngine';
import {
  createComposerThemeBridge,
} from '../composer/ComposerThemeBridge';
import {
  createComposerPersistenceBridge,
} from '../composer/ComposerPersistenceBridge';
import type {
  ComposerAccessibilitySnapshot,
  ComposerModuleContext,
  ComposerModuleValue,
  ComposerPersistenceBridgeLike,
  ComposerRegistryLike,
  ComposerRenderableModule,
  ComposerThemeBridgeLike,
  ComposerValidationReport,
  ComposerZoneId,
  MasterTabletComposerProps,
} from '../composer/ComposerTypes';
import {
  TabletApplicationShell,
} from './TabletApplicationShell';
import {
  QuestionTablet,
} from './QuestionTablet';
import {
  createMasterComposerRegistry,
} from './MasterComposerRegistry';


const NO_PERSISTENCE_SNAPSHOT = Object.freeze({
  version: 0,
  status: 'idle' as const,
  profile: null,
  activeSaveId: null,
  lastSavedAt: null,
  lastRestoredAt: null,
  error: null,
});

const noStoreSubscription = (): (() => void) => () => undefined;
const getNoPersistenceSnapshot = () => NO_PERSISTENCE_SNAPSHOT;

const styles = `
  .qcq-master-composer {
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    color: var(--qcq-text-primary, #f7fcff);
    background: var(--qcq-canvas, #01030a);
    font-family: var(--qcq-font-sans, Inter, system-ui, sans-serif);
    font-size: calc(1rem * var(--qcq-composer-text-scale, 1));
    container-type: size;
  }

  .qcq-master-composer__tablet-stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .qcq-master-composer__question {
    position: relative;
    z-index: 8;
    min-width: 0;
    min-height: 0;
  }

  .qcq-master-composer__empty {
    display: grid;
    place-items: center;
    min-height: min(40rem, 68cqh);
    padding: clamp(1rem, 3cqi, 3rem);
    border: var(--qcq-border-thin, 1px) solid var(--qcq-border, #31506b);
    border-radius: var(--qcq-radius-lg, .875rem);
    color: var(--qcq-text-secondary, #cfe4ee);
    text-align: center;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 4%), transparent),
      var(--qcq-surface, #071329);
    box-shadow: var(--qcq-elevation-panel-shadow, none);
  }

  .qcq-master-composer__zone-stack {
    display: contents;
  }

  .qcq-master-composer__failure {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 24rem;
    padding: 2rem;
    border: 2px solid var(--qcq-status-danger-border, #ff6f78);
    border-radius: var(--qcq-radius-lg, .875rem);
    color: var(--qcq-status-danger-foreground, #fff0f2);
    background: var(--qcq-status-danger-background, #4b111b);
  }

  .qcq-master-composer__failure-message {
    max-width: 64ch;
    margin: 0;
    font: 600 1rem/1.55 var(--qcq-font-sans, system-ui, sans-serif);
  }

  .qcq-master-composer[data-qcq-composer-ready="false"] {
    cursor: progress;
  }

  .qcq-master-composer[data-qcq-contrast="forced-colors"] {
    color: CanvasText;
    background: Canvas;
  }

  @media (forced-colors: active) {
    .qcq-master-composer__empty,
    .qcq-master-composer__failure {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }
  }
`;

function isRenderableModule(
  value: ComposerModuleValue,
): value is ComposerRenderableModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'component' in value &&
    typeof value.component === 'function' &&
    'order' in value &&
    typeof value.order === 'number'
  );
}

function renderRegisteredModules(
  registry: ComposerRegistryLike,
  zone: ComposerZoneId,
  context: ComposerModuleContext,
): ReactNode {
  const modules = registry
    .list({ zone, enabledOnly: true })
    .filter((descriptor) => isRenderableModule(descriptor.value))
    .sort((left, right) => {
      const leftValue = left.value as ComposerRenderableModule;
      const rightValue = right.value as ComposerRenderableModule;
      return leftValue.order - rightValue.order ||
        left.artifactId.localeCompare(right.artifactId);
    });

  return modules.map((descriptor) => {
    const renderable = descriptor.value as ComposerRenderableModule;
    const Component: ComponentType<{
      readonly context: ComposerModuleContext;
      readonly zone: ComposerZoneId;
    }> = renderable.component;
    return (
      <Component
        key={descriptor.artifactId}
        context={context}
        zone={zone}
      />
    );
  });
}

function layoutQuality(
  quality: 'performance' | 'balanced' | 'cinematic',
): LayoutQualityPolicy {
  if (quality === 'cinematic') return 'ultra';
  if (quality === 'performance') return 'minimal';
  return 'balanced';
}

function frameQuality(
  quality: 'performance' | 'balanced' | 'cinematic',
): BorderFrameQuality {
  if (quality === 'cinematic') return 'ultra';
  if (quality === 'performance') return 'minimal';
  return 'balanced';
}

function layoutMotion(
  accessibility: ComposerAccessibilitySnapshot,
): LayoutMotionPolicy {
  if (accessibility.motion === 'static') return 'none';
  if (accessibility.motion === 'reduced') return 'reduced';
  return 'full';
}

function errorMessage(
  report: ComposerValidationReport,
): string {
  const critical = report.issues.find(
    (issue) =>
      issue.severity === 'critical' ||
      issue.severity === 'error',
  );
  return critical?.message ??
    COMPOSER_DEFAULT_TEXT.validationFailure;
}

export function MasterTabletComposer({
  runtime,
  config: configInput,
  registry: providedRegistry,
  themeManifest,
  accessibilityEngine: providedAccessibility,
  themeBridge: providedThemeBridge,
  persistenceBridge: providedPersistence,
  persistenceMapper,
  initialProfile,
  className,
  ariaLabel = COMPOSER_DEFAULT_TEXT.ariaLabel,
  debug,
  onReady,
  onFailure,
}: MasterTabletComposerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const readyNotifiedRef = useRef(false);
  const restoreAttemptedRef = useRef(false);

  const config = useMemo(
    () =>
      resolveComposerConfig(
        debug === undefined
          ? configInput
          : { ...configInput, debug },
      ),
    [configInput, debug],
  );

  const registry = useMemo<ComposerRegistryLike>(
    () => providedRegistry ?? createMasterComposerRegistry(),
    [providedRegistry],
  );
  const registryStore = useMemo(
    () =>
      Object.freeze({
        subscribe:
          registry.subscribe.bind(registry),
        getSnapshot:
          registry.getSnapshot.bind(registry),
        getServerSnapshot:
          registry.getServerSnapshot.bind(registry),
      }),
    [registry],
  );
  const registrySnapshot = useSyncExternalStore(
    registryStore.subscribe,
    registryStore.getSnapshot,
    registryStore.getServerSnapshot,
  );

  const runtimeStore = useMemo(
    () =>
      Object.freeze({
        subscribe:
          runtime.subscribe.bind(runtime),
        getSnapshot:
          runtime.getSnapshot.bind(runtime),
        getServerSnapshot:
          runtime.getServerSnapshot.bind(runtime),
      }),
    [runtime],
  );
  const runtimeSnapshot = useSyncExternalStore(
    runtimeStore.subscribe,
    runtimeStore.getSnapshot,
    runtimeStore.getServerSnapshot,
  );

  const accessibility = useMemo(
    () =>
      providedAccessibility ??
      createComposerAccessibilityEngine(
        config.accessibility,
      ),
    [
      config.accessibility,
      providedAccessibility,
    ],
  );
  useEffect(() => {
    accessibility.updatePreferences(config.accessibility);
  }, [accessibility, config.accessibility]);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    accessibility.start(document);
    return () => accessibility.stop();
  }, [accessibility]);

  const accessibilityStore = useMemo(
    () =>
      Object.freeze({
        subscribe:
          accessibility.subscribe.bind(
            accessibility,
          ),
        getSnapshot:
          accessibility.getSnapshot.bind(
            accessibility,
          ),
        getServerSnapshot:
          accessibility.getServerSnapshot.bind(
            accessibility,
          ),
      }),
    [accessibility],
  );
  const accessibilitySnapshot =
    useSyncExternalStore(
      accessibilityStore.subscribe,
      accessibilityStore.getSnapshot,
      accessibilityStore.getServerSnapshot,
    );

  const theme = useMemo<ComposerThemeBridgeLike>(
    () =>
      providedThemeBridge ??
      createComposerThemeBridge(themeManifest),
    [providedThemeBridge, themeManifest],
  );
  const themeStore = useMemo(
    () =>
      Object.freeze({
        subscribe:
          theme.subscribe.bind(theme),
        getSnapshot:
          theme.getSnapshot.bind(theme),
        getServerSnapshot:
          theme.getServerSnapshot.bind(theme),
      }),
    [theme],
  );
  const themeSnapshot = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return undefined;
    theme.attach(root, config, accessibilitySnapshot);
    return () => theme.detach();
  }, [accessibilitySnapshot, config, theme]);

  const persistence = useMemo<ComposerPersistenceBridgeLike | null>(
    () => {
      if (!config.persistence.enabled) return null;
      return (
        providedPersistence ??
        createComposerPersistenceBridge({
          config: config.persistence,
          defaultProfile: initialProfile,
        })
      );
    },
    [
      config.persistence,
      initialProfile,
      providedPersistence,
    ],
  );

  const persistenceStore = useMemo(
    () =>
      persistence === null
        ? null
        : Object.freeze({
            subscribe:
              persistence.subscribe.bind(
                persistence,
              ),
            getSnapshot:
              persistence.getSnapshot.bind(
                persistence,
              ),
            getServerSnapshot:
              persistence.getServerSnapshot.bind(
                persistence,
              ),
          }),
    [persistence],
  );

  const persistenceSnapshot =
    useSyncExternalStore(
      persistenceStore?.subscribe ??
        noStoreSubscription,
      persistenceStore?.getSnapshot ??
        getNoPersistenceSnapshot,
      persistenceStore?.getServerSnapshot ??
        getNoPersistenceSnapshot,
    );

  useEffect(() => {
    if (persistence === null) return undefined;
    void persistence.initialize(initialProfile).catch((error: unknown) => {
      onFailure?.(
        error instanceof Error
          ? error
          : new Error('Persistence initialization failed.'),
        null,
      );
    });
    return () => {
      if (providedPersistence === undefined) {
        persistence.dispose();
      } else {
        void persistence.flush().catch(() => undefined);
      }
    };
  }, [
    initialProfile,
    onFailure,
    persistence,
    providedPersistence,
  ]);

  useEffect(() => {
    if (
      persistence === null ||
      persistenceMapper === undefined ||
      !config.persistence.autoRestore ||
      restoreAttemptedRef.current ||
      runtimeSnapshot.saveId === null
    ) {
      return;
    }
    restoreAttemptedRef.current = true;
    void persistence
      .restore(
        runtimeSnapshot.saveId,
        runtime,
        persistenceMapper,
      )
      .catch((error: unknown) => {
        onFailure?.(
          error instanceof Error
            ? error
            : new Error('Automatic session restoration failed.'),
          null,
        );
      });
  }, [
    config.persistence.autoRestore,
    onFailure,
    persistence,
    persistenceMapper,
    runtime,
    runtimeSnapshot.saveId,
  ]);

  useEffect(() => {
    if (
      persistence === null ||
      persistenceMapper === undefined ||
      !config.persistence.autoSave ||
      runtimeSnapshot.lifecycle !== 'ready'
    ) {
      return;
    }
    persistence.scheduleSave(
      runtimeSnapshot,
      persistenceMapper,
    );
  }, [
    config.persistence.autoSave,
    persistence,
    persistenceMapper,
    runtimeSnapshot,
  ]);

  const validationRegistry = useMemo(
    () =>
      Object.freeze({
        registry,
        version: registrySnapshot.version,
      }),
    [
      registry,
      registrySnapshot.version,
    ],
  );

  const validation = useMemo(
    () =>
      new ComposerValidationEngine().validate(
        COMPOSER_MANIFEST,
        validationRegistry.registry,
        config,
        runtimeSnapshot,
      ),
    [
      config,
      runtimeSnapshot,
      validationRegistry,
    ],
  );

  useEffect(() => {
    if (!validation.valid) {
      const error = new ComposerValidationError(
        'QCQ master composition validation failed.',
        validation,
      );
      onFailure?.(error, validation);
      return;
    }
    if (!readyNotifiedRef.current) {
      readyNotifiedRef.current = true;
      onReady?.(validation);
    }
  }, [onFailure, onReady, validation]);

  const moduleContext: ComposerModuleContext = Object.freeze({
    config,
    runtime: runtimeSnapshot,
    accessibility: accessibilitySnapshot,
    theme: themeSnapshot,
    persistence: persistence === null
      ? null
      : persistenceSnapshot,
  });

  const registeredEnvironment = renderRegisteredModules(
    registry,
    'environment',
    moduleContext,
  );
  const registeredPerformance = renderRegisteredModules(
    registry,
    'performance',
    moduleContext,
  );
  const registeredTablet = renderRegisteredModules(
    registry,
    'tablet',
    moduleContext,
  );
  const registeredMetrics = renderRegisteredModules(
    registry,
    'metrics',
    moduleContext,
  );
  const registeredPlayerBanner = renderRegisteredModules(
    registry,
    'player-banner',
    moduleContext,
  );

  const rootAttributes = accessibility.getRootAttributes();
  const lifecycle = validation.valid
    ? runtimeSnapshot.lifecycle
    : 'failed';
  const ready =
    validation.valid &&
    runtimeSnapshot.lifecycle === 'ready';
  const degraded =
    !validation.valid ||
    runtimeSnapshot.lifecycle === 'degraded';

  const classes = [
    'qcq-master-composer',
    className,
  ].filter(Boolean).join(' ');

  if (!validation.valid && config.validation.strict) {
    return (
      <>
        <style>{styles}</style>
        <div
          ref={rootRef}
          className={classes}
          role="alert"
          aria-label={ariaLabel}
          {...rootAttributes}
          {...{
            [COMPOSER_DATA_ATTRIBUTES.root]:
              COMPOSER_ARTIFACT_IDS.master,
            [COMPOSER_DATA_ATTRIBUTES.version]:
              COMPOSER_VERSION,
            [COMPOSER_DATA_ATTRIBUTES.lifecycle]:
              'failed',
            [COMPOSER_DATA_ATTRIBUTES.ready]:
              'false',
            [COMPOSER_DATA_ATTRIBUTES.degraded]:
              'true',
            [COMPOSER_DATA_ATTRIBUTES.validation]:
              'failed',
          }}
        >
          <div className="qcq-master-composer__failure">
            <p className="qcq-master-composer__failure-message">
              {errorMessage(validation)}
            </p>
          </div>
        </div>
      </>
    );
  }

  const environment = (
    <Fragment>
      {config.activeZones.includes('environment') ? (
        <StormLayer
          active={!accessibilitySnapshot.forcedColorsActive}
          quality={
            accessibilitySnapshot.reducedSensory
              ? 'performance'
              : config.visual.quality
          }
          motion={
            accessibilitySnapshot.motion === 'static'
              ? 'static'
              : accessibilitySnapshot.motion
          }
          intensity={
            accessibilitySnapshot.reducedSensory
              ? Math.min(0.25, config.visual.stormIntensity)
              : config.visual.stormIntensity
          }
          lightning={
            config.visual.lightningEnabled &&
            !accessibilitySnapshot.reducedSensory
          }
          particles={
            config.visual.particlesEnabled &&
            !accessibilitySnapshot.reducedSensory
          }
          opacity={
            accessibilitySnapshot.reducedTransparency
              ? 0.35
              : 1
          }
        />
      ) : null}
      {registeredEnvironment}
    </Fragment>
  );

  const tablet = (
    <TabletApplicationShell
      applicationTitle={config.applicationTitle}
      applicationSubtitle={config.applicationSubtitle}
      statusMessage={
        runtimeSnapshot.statusMessage ||
        (ready
          ? COMPOSER_DEFAULT_TEXT.readyStatus
          : COMPOSER_DEFAULT_TEXT.loadingStatus)
      }
      motionPreference={
        accessibilitySnapshot.motion === 'full'
          ? 'full'
          : 'reduced'
      }
      layoutMode={
        config.visual.density === 'cinematic'
          ? 'command'
          : config.visual.density === 'compact'
            ? 'compact'
            : 'balanced'
      }
      contentKey={runtimeSnapshot.contentKey}
      utilityControls={runtimeSnapshot.utilityControls}
      supportingContent={
        runtimeSnapshot.tabletSupportingContent
      }
      lowerDeck={runtimeSnapshot.tabletLowerDeck}
    >
      <div className="qcq-master-composer__tablet-stage">
        <BorderFrameEngine
          active={!accessibilitySnapshot.forcedColorsActive}
          quality={frameQuality(config.visual.quality)}
          intensity={config.visual.frameIntensity}
        />

        {runtimeSnapshot.question !== null ? (
          <QuestionTablet
            className="qcq-master-composer__question"
            question={runtimeSnapshot.question}
            questionIndex={runtimeSnapshot.questionIndex}
            totalQuestions={runtimeSnapshot.totalQuestions}
            answeredCount={runtimeSnapshot.answeredCount}
            flaggedCount={runtimeSnapshot.flaggedCount}
            selectedOptionIds={
              runtimeSnapshot.selectedOptionIds
            }
            validationResult={
              runtimeSnapshot.validationResult
            }
            validationState={
              runtimeSnapshot.validationState
            }
            correctOptionIds={
              runtimeSnapshot.correctOptionIds
            }
            disabled={
              runtimeSnapshot.lifecycle !== 'ready'
            }
            {...(
              runtimeSnapshot.timerProps === null
                ? {}
                : { timerProps: runtimeSnapshot.timerProps }
            )}
            allowTwoAnswerColumns={
              config.visual.density !== 'compact'
            }
            showFeedback
            onSelectionChange={(optionIds) => {
              runtime.selectAnswers(optionIds);
            }}
            onSubmit={(request) => {
              void Promise.resolve(
                runtime.submitCurrentQuestion(request),
              ).catch((error: unknown) => {
                onFailure?.(
                  error instanceof Error
                    ? error
                    : new Error('Question submission failed.'),
                  validation,
                );
              });
            }}
            onNext={() => {
              void Promise.resolve(
                runtime.advanceToNextQuestion(),
              ).catch((error: unknown) => {
                onFailure?.(
                  error instanceof Error
                    ? error
                    : new Error('Question progression failed.'),
                  validation,
                );
              });
            }}
          />
        ) : (
          <div
            className="qcq-master-composer__empty"
            role="status"
            aria-live="polite"
          >
            {runtimeSnapshot.emptyState ??
              COMPOSER_DEFAULT_TEXT.noQuestionStatus}
          </div>
        )}

        {registeredTablet}
      </div>
    </TabletApplicationShell>
  );

  const metrics = (
    <Fragment>
      {runtimeSnapshot.metrics !== null ? (
        <MetricsPanel
          metrics={runtimeSnapshot.metrics}
          compact={config.visual.density === 'compact'}
        />
      ) : null}
      {registeredMetrics}
    </Fragment>
  );

  return (
    <>
      <style>{styles}</style>
      <div
        ref={rootRef}
        className={classes}
        aria-label={ariaLabel}
        {...rootAttributes}
        {...{
          [COMPOSER_DATA_ATTRIBUTES.root]:
            COMPOSER_ARTIFACT_IDS.master,
          [COMPOSER_DATA_ATTRIBUTES.version]:
            COMPOSER_VERSION,
          [COMPOSER_DATA_ATTRIBUTES.lifecycle]:
            lifecycle,
          [COMPOSER_DATA_ATTRIBUTES.ready]:
            String(ready),
          [COMPOSER_DATA_ATTRIBUTES.degraded]:
            String(degraded),
          [COMPOSER_DATA_ATTRIBUTES.validation]:
            validation.valid ? 'passed' : 'degraded',
        }}
      >
        <LayoutEngine
          environment={environment}
          performance={
            <Fragment>
              {runtimeSnapshot.performanceContent}
              {registeredPerformance}
            </Fragment>
          }
          tablet={tablet}
          metrics={metrics}
          playerBanner={
            <Fragment>
              {runtimeSnapshot.playerBannerContent}
              {registeredPlayerBanner}
            </Fragment>
          }
          activeZones={COMPOSER_ZONE_ORDER.filter(
            (zone) => config.activeZones.includes(zone),
          )}
          quality={layoutQuality(config.visual.quality)}
          motion={layoutMotion(accessibilitySnapshot)}
          debug={config.debug}
          ariaLabel={ariaLabel}
        />
      </div>
    </>
  );
}

export default MasterTabletComposer;
