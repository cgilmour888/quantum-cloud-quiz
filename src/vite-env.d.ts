/**
 * Quantum Certification Quest
 * Client Environment Contract
 *
 * All custom Vite environment variables are optional because
 * deployment environments may omit them and runtimeConfig owns
 * the authoritative defaults and validation behavior.
 *
 * This declaration intentionally contains no imports so that
 * Vite's global ImportMetaEnv augmentation remains effective.
 */

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_QCQ_APP_NAME?: string;
  readonly VITE_QCQ_APP_VERSION?: string;
  readonly VITE_QCQ_CHANNEL?: string;
  readonly VITE_PUBLIC_BASE_PATH?: string;

  readonly VITE_QCQ_BUILD_COMMIT?: string;
  readonly VITE_QCQ_BUILD_TIMESTAMP?: string;
  readonly VITE_QCQ_DEPLOYMENT_ID?: string;

  readonly VITE_QCQ_DATASET_IMPORT?: string;
  readonly VITE_QCQ_CINEMATIC_EFFECTS?: string;
  readonly VITE_QCQ_AI_BRIDGE?: string;
  readonly VITE_QCQ_ANALYTICS_BRIDGE?: string;
  readonly VITE_QCQ_ORGANIZATION_BRIDGE?: string;
  readonly VITE_QCQ_SAAS_BRIDGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
