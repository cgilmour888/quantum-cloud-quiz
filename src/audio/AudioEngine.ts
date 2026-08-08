/**
 * Artifact ID: QCQ-AUD-007
 * Artifact Name: AudioEngine
 * Repository Path: QCQ/frontend/src/audio/AudioEngine.ts
 */

import {
  AudioBus,
} from './AudioBus';
import {
  detectAudioCapabilities,
  selectSupportedAudioSource,
} from './AudioCapabilities';
import {
  DEFAULT_AUDIO_POLICIES,
} from './AudioPolicies';
import {
  AudioRegistry,
  audioRegistry,
} from './AudioRegistry';
import type {
  AudioAssetDefinition,
  AudioBusName,
  AudioPolicySet,
} from './audio.types';

export type AudioPlaybackBlockReason =
  | 'gesture-required'
  | 'asset-pending'
  | 'unsupported-format'
  | 'bus-disabled'
  | 'voice-limit'
  | 'cooldown'
  | 'playback-rejected';

export type AudioPlaybackResult =
  | {
      readonly status: 'started';
      readonly assetId: string;
    }
  | {
      readonly status: 'blocked';
      readonly assetId: string;
      readonly reason:
        AudioPlaybackBlockReason;
    };

export type AudioElementFactory = (
  source: string,
) => HTMLAudioElement;

interface ActiveVoice {
  readonly assetId: string;
  readonly bus: AudioBusName;
}

const AUDIO_BUS_NAMES = [
  'music',
  'environment',
  'interface',
  'gameplay',
  'achievements',
] as const satisfies readonly AudioBusName[];

function createBrowserAudioElement(
  source: string,
): HTMLAudioElement {
  return new Audio(
    source,
  );
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

export class AudioEngine {
  private readonly buses =
    new Map<
      AudioBusName,
      AudioBus
    >();

  private readonly activeVoices =
    new Map<
      HTMLAudioElement,
      ActiveVoice
    >();

  private readonly lastPlaybackAt =
    new Map<
      string,
      number
    >();

  private masterGain = 1;
  private unlocked = false;
  private muted = false;

  public constructor(
    private readonly registry:
      AudioRegistry =
        audioRegistry,
    policies:
      AudioPolicySet =
        DEFAULT_AUDIO_POLICIES,
    private readonly createAudioElement:
      AudioElementFactory =
        createBrowserAudioElement,
  ) {
    for (
      const busName
      of AUDIO_BUS_NAMES
    ) {
      this.buses.set(
        busName,
        new AudioBus(
          busName,
          policies.buses[
            busName
          ],
        ),
      );
    }
  }

  public unlock(): void {
    this.unlocked = true;
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public setMuted(
    muted: boolean,
  ): void {
    this.muted = muted;

    this.refreshActiveVolumes();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterGain(
    gain: number,
  ): void {
    this.masterGain =
      clampGain(
        gain,
      );

    this.refreshActiveVolumes();
  }

  public getMasterGain(): number {
    return this.masterGain;
  }

  public setBusEnabled(
    busName: AudioBusName,
    enabled: boolean,
  ): void {
    this.requireBus(
      busName,
    ).setEnabled(
      enabled,
    );

    this.refreshActiveVolumes();
  }

  public setBusGain(
    busName: AudioBusName,
    gain: number,
  ): void {
    this.requireBus(
      busName,
    ).setGain(
      gain,
    );

    this.refreshActiveVolumes();
  }

  public async play(
    assetId: string,
  ): Promise<AudioPlaybackResult> {
    const asset =
      this.registry.require(
        assetId,
      );

    if (
      !this.unlocked
    ) {
      return this.blocked(
        asset,
        'gesture-required',
      );
    }

    if (
      asset.availability
      !== 'ready'
    ) {
      return this.blocked(
        asset,
        'asset-pending',
      );
    }

    const bus =
      this.requireBus(
        asset.bus,
      );

    if (
      !bus.isEnabled()
    ) {
      return this.blocked(
        asset,
        'bus-disabled',
      );
    }

    if (
      this.isCoolingDown(
        asset,
      )
    ) {
      return this.blocked(
        asset,
        'cooldown',
      );
    }

    if (
      this.countActiveVoices(
        asset.id,
      )
      >= asset.maxVoices
    ) {
      return this.blocked(
        asset,
        'voice-limit',
      );
    }

    const capabilities =
      detectAudioCapabilities();

    const source =
      selectSupportedAudioSource(
        asset.sources,
        capabilities,
      );

    if (
      source === undefined
    ) {
      return this.blocked(
        asset,
        'unsupported-format',
      );
    }

    if (
      !bus.acquireVoice()
    ) {
      return this.blocked(
        asset,
        'voice-limit',
      );
    }

    const audio =
      this.createAudioElement(
        source.path,
      );

    audio.loop =
      asset.loop;

    audio.preload =
      asset.preload;

    audio.volume =
      this.calculateVolume(
        asset,
      );

    this.activeVoices.set(
      audio,
      {
        assetId:
          asset.id,
        bus:
          asset.bus,
      },
    );

    const release = () => {
      this.releaseVoice(
        audio,
      );
    };

    audio.addEventListener(
      'ended',
      release,
      {
        once: true,
      },
    );

    audio.addEventListener(
      'error',
      release,
      {
        once: true,
      },
    );

    try {
      await audio.play();
    } catch {
      this.releaseVoice(
        audio,
      );

      return this.blocked(
        asset,
        'playback-rejected',
      );
    }

    this.lastPlaybackAt.set(
      asset.id,
      Date.now(),
    );

    return {
      status: 'started',
      assetId:
        asset.id,
    };
  }

  public stopAsset(
    assetId: string,
  ): void {
    for (
      const [
        audio,
        voice,
      ]
      of [
        ...this.activeVoices,
      ]
    ) {
      if (
        voice.assetId
        !== assetId
      ) {
        continue;
      }

      audio.pause();

      this.releaseVoice(
        audio,
      );
    }
  }

  public stopBus(
    busName: AudioBusName,
  ): void {
    for (
      const [
        audio,
        voice,
      ]
      of [
        ...this.activeVoices,
      ]
    ) {
      if (
        voice.bus
        !== busName
      ) {
        continue;
      }

      audio.pause();

      this.releaseVoice(
        audio,
      );
    }
  }

  public stopAll(): void {
    for (
      const audio
      of [
        ...this.activeVoices.keys(),
      ]
    ) {
      audio.pause();

      this.releaseVoice(
        audio,
      );
    }
  }

  private blocked(
    asset: AudioAssetDefinition,
    reason:
      AudioPlaybackBlockReason,
  ): AudioPlaybackResult {
    return {
      status: 'blocked',
      assetId:
        asset.id,
      reason,
    };
  }

  private requireBus(
    busName: AudioBusName,
  ): AudioBus {
    const bus =
      this.buses.get(
        busName,
      );

    if (
      bus === undefined
    ) {
      throw new Error(
        `QCQ audio bus is unavailable: ${busName}`,
      );
    }

    return bus;
  }

  private calculateVolume(
    asset:
      AudioAssetDefinition,
  ): number {
    if (
      this.muted
    ) {
      return 0;
    }

    return clampGain(
      this.requireBus(
        asset.bus,
      ).getEffectiveGain(
        this.masterGain,
      )
      * asset.defaultGain,
    );
  }

  private refreshActiveVolumes():
    void {
    for (
      const [
        audio,
        voice,
      ]
      of this.activeVoices
    ) {
      const asset =
        this.registry.require(
          voice.assetId,
        );

      audio.volume =
        this.calculateVolume(
          asset,
        );
    }
  }

  private isCoolingDown(
    asset:
      AudioAssetDefinition,
  ): boolean {
    const lastPlayedAt =
      this.lastPlaybackAt.get(
        asset.id,
      );

    if (
      lastPlayedAt === undefined
      || asset.cooldownMs === 0
    ) {
      return false;
    }

    return (
      Date.now()
      - lastPlayedAt
      < asset.cooldownMs
    );
  }

  private countActiveVoices(
    assetId: string,
  ): number {
    let count = 0;

    for (
      const voice
      of this.activeVoices.values()
    ) {
      if (
        voice.assetId
        === assetId
      ) {
        count += 1;
      }
    }

    return count;
  }

  private releaseVoice(
    audio:
      HTMLAudioElement,
  ): void {
    const voice =
      this.activeVoices.get(
        audio,
      );

    if (
      voice === undefined
    ) {
      return;
    }

    this.activeVoices.delete(
      audio,
    );

    this.requireBus(
      voice.bus,
    ).releaseVoice();
  }
}

export const audioEngine =
  new AudioEngine();
