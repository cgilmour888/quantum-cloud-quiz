export type RenderingTier =
  | 'foundation'
  | 'balanced'
  | 'cinematic';

export type RenderingResolutionClass =
  | 'hd'
  | 'qhd'
  | '4k'
  | '8k'
  | '12k';

export interface RenderingManifestContract {
  readonly artifactId: 'QCQ-STEP2-028';
  readonly schemaVersion: '1.0.0';
  readonly defaultTier: RenderingTier;
  readonly canonicalTargets: Readonly<
    Record<
      '4k' | '8k' | '12k',
      {
        readonly width: number;
        readonly height: number;
      }
    >
  >;
  readonly principles: readonly string[];
}

export const RENDERING_MANIFEST:
  RenderingManifestContract = Object.freeze({
    artifactId: 'QCQ-STEP2-028',
    schemaVersion: '1.0.0',
    defaultTier: 'balanced',
    canonicalTargets: Object.freeze({
      '4k': Object.freeze({
        width: 3840,
        height: 2160,
      }),
      '8k': Object.freeze({
        width: 7680,
        height: 4320,
      }),
      '12k': Object.freeze({
        width: 11520,
        height: 6480,
      }),
    }),
    principles: Object.freeze([
      'Rendering governance may tune cost but may not own feature state.',
      'MASTER artwork is a visual specification only.',
      'Reduced-motion and forced-colors preferences override decorative rendering.',
      '4K, 8K, and 12K readiness is achieved through scalable web-native rendering.',
      'High pixel count may reduce DPR and effects before reducing semantic readability.',
    ]),
  });
