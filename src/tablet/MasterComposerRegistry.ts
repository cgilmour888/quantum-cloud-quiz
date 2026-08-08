/**
 * Quantum Certification Quest
 * Master Composer Registry Authority
 *
 * Non-React construction authority for the QCQ-TBL-040
 * master composer registry.
 */

import LayoutEngine from '../app/LayoutEngine';

import {
  BorderFrameEngine,
} from '../frame/BorderFrameEngine';

import {
  MetricsPanel,
} from '../metrics/MetricsPanel';

import {
  StormLayer,
} from '../effects/StormLayer';

import {
  COMPOSER_ARTIFACT_IDS,
  COMPOSER_BUILTIN_MODULE_IDS,
  COMPOSER_VERSION,
} from '../composer/ComposerConstants';

import {
  resolveComposerConfig,
} from '../composer/ComposerConfig';

import {
  ComposerDependencyGraph,
} from '../composer/ComposerDependencyGraph';

import {
  COMPOSER_MANIFEST,
} from '../composer/ComposerManifest';

import {
  ComposerRegistry,
  createComposerRegistry,
} from '../composer/ComposerRegistry';

import {
  ComposerValidationEngine,
} from '../composer/ComposerValidationEngine';

import {
  ComposerAccessibilityEngine,
} from '../composer/ComposerAccessibilityEngine';

import {
  ComposerThemeBridge,
} from '../composer/ComposerThemeBridge';

import {
  ComposerPersistenceBridge,
} from '../composer/ComposerPersistenceBridge';

import type {
  ComposerModuleDescriptor,
  ComposerZoneId,
} from '../composer/ComposerTypes';

import {
  TabletApplicationShell,
} from './TabletApplicationShell';

import {
  QuestionTablet,
} from './QuestionTablet';

function serviceDescriptor(
  artifactId: string,
  artifactName: string,
  service: unknown,
  kind:
    | 'application'
    | 'component'
    | 'service'
    | 'effect'
    | 'theme'
    | 'persistence',
  dependencies: readonly string[] = [],
  zone: ComposerZoneId | null = null,
): ComposerModuleDescriptor {
  return Object.freeze({
    artifactId,
    artifactName,
    version: COMPOSER_VERSION,
    kind,
    zone,
    dependencies: Object.freeze([
      ...dependencies,
    ]),
    compatibleWith: Object.freeze({
      minimumVersion:
        '0.1.0-foundation.1',
      maximumVersion: null,
    }),
    value: Object.freeze({
      service,
    }),
    enabled: true,
    metadata: Object.freeze({
      registration: 'builtin',
      owner: 'MasterTabletComposer',
    }),
  });
}

export function createMasterComposerRegistry():
  ComposerRegistry {
  return createComposerRegistry([
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.applicationLayout,
      'LayoutEngine',
      LayoutEngine,
      'application',
      ['QCQ-APP-001'],
    ),
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.tabletShell,
      'TabletApplicationShell',
      TabletApplicationShell,
      'component',
      [
        COMPOSER_BUILTIN_MODULE_IDS.applicationLayout,
      ],
      'tablet',
    ),
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.borderFrame,
      'BorderFrameEngine',
      BorderFrameEngine,
      'effect',
      [
        COMPOSER_BUILTIN_MODULE_IDS.tabletShell,
      ],
      'tablet',
    ),
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.questionTablet,
      'QuestionTablet',
      QuestionTablet,
      'component',
      [
        COMPOSER_BUILTIN_MODULE_IDS.tabletShell,
      ],
      'tablet',
    ),
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.metricsPanel,
      'MetricsPanel',
      MetricsPanel,
      'component',
      ['QCQ-TBL-026'],
      'metrics',
    ),
    serviceDescriptor(
      COMPOSER_BUILTIN_MODULE_IDS.stormLayer,
      'StormLayer',
      StormLayer,
      'effect',
      [
        'QCQ-TBL-031',
        'QCQ-TBL-032',
        'QCQ-TBL-033',
      ],
      'environment',
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.types,
      'ComposerTypes',
      'ComposerTypes',
      'service',
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.constants,
      'ComposerConstants',
      COMPOSER_VERSION,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.types,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.config,
      'ComposerConfig',
      resolveComposerConfig,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.types,
        COMPOSER_ARTIFACT_IDS.constants,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.manifest,
      'ComposerManifest',
      COMPOSER_MANIFEST,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.types,
        COMPOSER_ARTIFACT_IDS.constants,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.dependencyGraph,
      'ComposerDependencyGraph',
      ComposerDependencyGraph,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.types,
        COMPOSER_ARTIFACT_IDS.constants,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.registry,
      'ComposerRegistry',
      ComposerRegistry,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.types,
        COMPOSER_ARTIFACT_IDS.dependencyGraph,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.validation,
      'ComposerValidationEngine',
      ComposerValidationEngine,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.manifest,
        COMPOSER_ARTIFACT_IDS.registry,
        COMPOSER_ARTIFACT_IDS.dependencyGraph,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.accessibility,
      'ComposerAccessibilityEngine',
      ComposerAccessibilityEngine,
      'service',
      [
        COMPOSER_ARTIFACT_IDS.config,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.themeBridge,
      'ComposerThemeBridge',
      ComposerThemeBridge,
      'theme',
      [
        COMPOSER_ARTIFACT_IDS.accessibility,
        'QCQ-THM-010',
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.persistenceBridge,
      'ComposerPersistenceBridge',
      ComposerPersistenceBridge,
      'persistence',
      [
        COMPOSER_ARTIFACT_IDS.config,
        COMPOSER_BUILTIN_MODULE_IDS.playerProfileStore,
        COMPOSER_BUILTIN_MODULE_IDS.saveGameEngine,
      ],
    ),
    serviceDescriptor(
      COMPOSER_ARTIFACT_IDS.master,
      'MasterTabletComposer',
      'MasterTabletComposer',
      'application',
      [
        COMPOSER_BUILTIN_MODULE_IDS.applicationLayout,
        COMPOSER_BUILTIN_MODULE_IDS.tabletShell,
        COMPOSER_BUILTIN_MODULE_IDS.borderFrame,
        COMPOSER_BUILTIN_MODULE_IDS.questionTablet,
        COMPOSER_BUILTIN_MODULE_IDS.metricsPanel,
        COMPOSER_BUILTIN_MODULE_IDS.stormLayer,
        COMPOSER_ARTIFACT_IDS.config,
        COMPOSER_ARTIFACT_IDS.manifest,
        COMPOSER_ARTIFACT_IDS.registry,
        COMPOSER_ARTIFACT_IDS.validation,
        COMPOSER_ARTIFACT_IDS.accessibility,
        COMPOSER_ARTIFACT_IDS.themeBridge,
        COMPOSER_ARTIFACT_IDS.persistenceBridge,
      ],
      'tablet',
    ),
  ]);
}
