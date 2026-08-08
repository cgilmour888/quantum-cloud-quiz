/**
 * Artifact ID: QCQ-AUD-001
 * Artifact Name: AudioTypes
 * Repository Path: QCQ/frontend/src/audio/audio.types.ts
 */

export type AudioBusName =
  | 'music'
  | 'environment'
  | 'interface'
  | 'gameplay'
  | 'achievements';

export type AudioAvailability =
  | 'pending'
  | 'ready';

export type AudioPreloadMode =
  | 'none'
  | 'metadata'
  | 'auto';

export type AudioSourceFormat =
  | 'audio/mpeg'
  | 'audio/ogg';

export interface AudioSourceDefinition {
  readonly path: string;
  readonly format: AudioSourceFormat;
}

export interface AudioAssetDefinition {
  readonly id: string;
  readonly bus: AudioBusName;
  readonly availability: AudioAvailability;
  readonly sources: readonly AudioSourceDefinition[];
  readonly loop: boolean;
  readonly preload: AudioPreloadMode;
  readonly defaultGain: number;
  readonly maxVoices: number;
  readonly cooldownMs: number;
}

export interface AudioBusPolicy {
  readonly enabledByDefault: boolean;
  readonly defaultGain: number;
  readonly maxConcurrentVoices: number;
}

export interface AudioPolicySet {
  readonly autoplay: 'gesture-required';
  readonly suspendWhenHidden: boolean;
  readonly respectReducedMotion: boolean;
  readonly buses: Readonly<
    Record<
      AudioBusName,
      AudioBusPolicy
    >
  >;
}
