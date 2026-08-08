/**
 * Artifact ID: QCQ-AUD-017
 * Artifact Name: StormAudioCoordinator
 * Repository Path: QCQ/frontend/src/audio/StormAudioCoordinator.ts
 */

import type {
  AudioPlaybackResult,
} from './AudioEngine';
import type {
  AudioEventName,
} from './AudioEvents';

export interface StormAudioSink {
  readonly playEvent:
    (
      event:
        AudioEventName,
    ) => Promise<AudioPlaybackResult>;

  readonly stopEvent:
    (
      event:
        AudioEventName,
    ) => void;
}

export interface StormStrikeDescriptor {
  readonly distance: number;
  readonly intensity: number;
}

export type CancelScheduledAudio =
  () => void;

export interface AudioScheduler {
  readonly schedule:
    (
      task: () => void,
      delayMs: number,
    ) => CancelScheduledAudio;
}

const browserAudioScheduler:
  AudioScheduler = {
    schedule(
      task,
      delayMs,
    ) {
      const timer =
        window.setTimeout(
          task,
          delayMs,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
  };

function clampUnit(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}

export class StormAudioCoordinator {
  private readonly pending =
    new Set<
      CancelScheduledAudio
    >();

  public constructor(
    private readonly sink:
      StormAudioSink,
    private readonly scheduler:
      AudioScheduler =
        browserAudioScheduler,
  ) {}

  public startStormRumble():
    Promise<AudioPlaybackResult> {
    return this.sink.playEvent(
      'stormRumble',
    );
  }

  public stopStormRumble():
    void {
    this.sink.stopEvent(
      'stormRumble',
    );
  }

  public triggerCloudFlicker():
    Promise<AudioPlaybackResult> {
    return this.sink.playEvent(
      'cloudFlicker',
    );
  }

  public triggerLightningStrike(
    descriptor:
      StormStrikeDescriptor,
  ): void {
    const distance =
      clampUnit(
        descriptor.distance,
      );

    const intensity =
      clampUnit(
        descriptor.intensity,
      );

    void this.sink.playEvent(
      'lightningCrack',
    );

    if (
      intensity >= 0.4
    ) {
      void this.sink.playEvent(
        'cloudFlicker',
      );
    }

    const thunderEvent:
      AudioEventName =
        (
          intensity >= 0.72
          || distance <= 0.32
        )
          ? 'thunderClose'
          : 'thunderDistant';

    const delayMs =
      Math.round(
        120
        + distance
          * 1700,
      );

    let cancel:
      CancelScheduledAudio =
        () => undefined;

    cancel =
      this.scheduler.schedule(
        () => {
          this.pending.delete(
            cancel,
          );

          void this.sink.playEvent(
            thunderEvent,
          );
        },
        delayMs,
      );

    this.pending.add(
      cancel,
    );
  }

  public cancelPendingThunder():
    void {
    for (
      const cancel
      of this.pending
    ) {
      cancel();
    }

    this.pending.clear();
  }

  public dispose(): void {
    this.cancelPendingThunder();

    this.stopStormRumble();
  }
}
