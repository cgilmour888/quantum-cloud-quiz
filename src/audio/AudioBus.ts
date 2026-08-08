/**
 * Artifact ID: QCQ-AUD-006
 * Artifact Name: AudioBus
 * Repository Path: QCQ/frontend/src/audio/AudioBus.ts
 */

import type {
  AudioBusName,
  AudioBusPolicy,
} from './audio.types';

export interface AudioBusSnapshot {
  readonly name: AudioBusName;
  readonly enabled: boolean;
  readonly gain: number;
  readonly activeVoices: number;
  readonly maxConcurrentVoices: number;
}

function clampGain(
  gain: number,
): number {
  return Math.min(
    1,
    Math.max(
      0,
      gain,
    ),
  );
}

export class AudioBus {
  private enabled: boolean;
  private gain: number;
  private activeVoices = 0;

  public constructor(
    private readonly name:
      AudioBusName,
    private readonly policy:
      AudioBusPolicy,
  ) {
    this.enabled =
      policy.enabledByDefault;

    this.gain =
      clampGain(
        policy.defaultGain,
      );
  }

  public setEnabled(
    enabled: boolean,
  ): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setGain(
    gain: number,
  ): void {
    this.gain =
      clampGain(
        gain,
      );
  }

  public getGain(): number {
    return this.gain;
  }

  public getEffectiveGain(
    masterGain: number,
  ): number {
    if (
      !this.enabled
    ) {
      return 0;
    }

    return clampGain(
      this.gain
      * clampGain(
        masterGain,
      ),
    );
  }

  public canAcquireVoice(): boolean {
    return (
      this.enabled
      && this.activeVoices
        < this.policy.maxConcurrentVoices
    );
  }

  public acquireVoice(): boolean {
    if (
      !this.canAcquireVoice()
    ) {
      return false;
    }

    this.activeVoices += 1;

    return true;
  }

  public releaseVoice(): void {
    this.activeVoices =
      Math.max(
        0,
        this.activeVoices - 1,
      );
  }

  public snapshot():
    AudioBusSnapshot {
    return {
      name: this.name,
      enabled: this.enabled,
      gain: this.gain,
      activeVoices:
        this.activeVoices,
      maxConcurrentVoices:
        this.policy
          .maxConcurrentVoices,
    };
  }
}
