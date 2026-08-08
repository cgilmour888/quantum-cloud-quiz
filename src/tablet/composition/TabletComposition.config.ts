/**
 * Artifact ID: QCQ-TBL-048
 * Artifact Name: TabletCompositionConfiguration
 * Artifact Purpose: Governed configuration for tablet insets, gaps, question allocation, feedback allocation, and answer sizing.
 * Artifact Layer: QCQ-TBL — CFG
 * Artifact Dependencies: QCQ-TBL-047
 * Artifact Dependents: QCQ-TBL-046
 * Dependency Graph: composition contracts -> TabletCompositionConfiguration -> TabletCompositionEngine
 * Repository Path: QCQ/frontend/src/tablet/composition
 * Source File: TabletComposition.config.ts
 */

export interface TabletCompositionConfig {
  readonly contentInsetRatio: number;
  readonly minimumContentInset: number;
  readonly maximumContentInset: number;
  readonly gapRatio: number;
  readonly minimumGap: number;
  readonly maximumGap: number;
  readonly headerHeightRatio: number;
  readonly footerHeightRatio: number;
  readonly minimumQuestionHeightRatio: number;
  readonly maximumQuestionHeightRatio: number;
  readonly feedbackHeightRatio: number;
  readonly compactWidthThreshold: number;
  readonly cinematicWidthThreshold: number;
}

export const TABLET_COMPOSITION_CONFIG: TabletCompositionConfig =
  Object.freeze({
    contentInsetRatio: 0.035,
    minimumContentInset: 12,
    maximumContentInset: 64,
    gapRatio: 0.018,
    minimumGap: 8,
    maximumGap: 28,
    headerHeightRatio: 0.09,
    footerHeightRatio: 0.06,
    minimumQuestionHeightRatio: 0.16,
    maximumQuestionHeightRatio: 0.32,
    feedbackHeightRatio: 0.11,
    compactWidthThreshold: 760,
    cinematicWidthThreshold: 2_560,
  });
