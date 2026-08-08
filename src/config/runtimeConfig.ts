export type RuntimeChannel =
  | 'development'
  | 'test'
  | 'preview'
  | 'production';

export interface RuntimeFeatureFlags {
  readonly datasetImport: boolean;
  readonly cinematicEffects: boolean;
  readonly aiBridge: boolean;
  readonly analyticsBridge: boolean;
  readonly organizationBridge: boolean;
  readonly saasBridge: boolean;
  readonly remoteTelemetry: boolean;
}

export interface RuntimeConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly channel: RuntimeChannel;
  readonly publicBasePath: string;
  readonly buildCommit: string | null;
  readonly buildTimestamp: string | null;
  readonly deploymentId: string | null;
  readonly features: RuntimeFeatureFlags;
}

function parseBoolean(
  value: string | boolean | undefined,
  fallback: boolean,
): boolean {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value.trim() === '') return fallback;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  throw new Error(
    `Invalid QCQ boolean runtime value: "${value}".`,
  );
}

function parseChannel(value: string | undefined): RuntimeChannel {
  const normalized = value?.trim().toLowerCase() ?? 'development';

  if (
    normalized === 'development' ||
    normalized === 'test' ||
    normalized === 'preview' ||
    normalized === 'production'
  ) {
    return normalized;
  }

  throw new Error(
    `Unsupported QCQ runtime channel: "${normalized}".`,
  );
}

function normalizeBasePath(value: string | undefined): string {
  const candidate = value?.trim();

  if (!candidate || candidate === '/') return '/';

  return `/${candidate.replace(/^\/+|\/+$/g, '')}/`;
}

function optionalText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const config: RuntimeConfig = {
  appName:
    import.meta.env.VITE_QCQ_APP_NAME?.trim() ||
    'Quantum Certification Quest',
  appVersion:
    import.meta.env.VITE_QCQ_APP_VERSION?.trim() ||
    '0.1.0-foundation.2',
  channel: parseChannel(import.meta.env.VITE_QCQ_CHANNEL),
  publicBasePath: normalizeBasePath(
    import.meta.env.VITE_PUBLIC_BASE_PATH,
  ),
  buildCommit: optionalText(
    import.meta.env.VITE_QCQ_BUILD_COMMIT,
  ),
  buildTimestamp: optionalText(
    import.meta.env.VITE_QCQ_BUILD_TIMESTAMP,
  ),
  deploymentId: optionalText(
    import.meta.env.VITE_QCQ_DEPLOYMENT_ID,
  ),
  features: Object.freeze({
    datasetImport: parseBoolean(
      import.meta.env.VITE_QCQ_DATASET_IMPORT,
      true,
    ),
    cinematicEffects: parseBoolean(
      import.meta.env.VITE_QCQ_CINEMATIC_EFFECTS,
      true,
    ),
    aiBridge: parseBoolean(
      import.meta.env.VITE_QCQ_AI_BRIDGE,
      false,
    ),
    analyticsBridge: parseBoolean(
      import.meta.env.VITE_QCQ_ANALYTICS_BRIDGE,
      false,
    ),
    organizationBridge: parseBoolean(
      import.meta.env.VITE_QCQ_ORGANIZATION_BRIDGE,
      false,
    ),
    saasBridge: parseBoolean(
      import.meta.env.VITE_QCQ_SAAS_BRIDGE,
      false,
    ),
    remoteTelemetry: false,
  }),
};

export const runtimeConfig: RuntimeConfig =
  Object.freeze({
    ...config,
    features: Object.freeze({
      ...config.features,
    }),
  });
