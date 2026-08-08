/**
 * Artifact ID: QCQ-AUD-003
 * Artifact Name: AudioPolicies
 * Repository Path: QCQ/frontend/src/audio/AudioPolicies.ts
 */

import type {
  AudioPolicySet,
} from './audio.types';

export const DEFAULT_AUDIO_POLICIES = {
  autoplay: 'gesture-required',
  suspendWhenHidden: true,
  respectReducedMotion: true,
  buses: {
    music: {
      enabledByDefault: true,
      defaultGain: 0.35,
      maxConcurrentVoices: 1,
    },
    environment: {
      enabledByDefault: true,
      defaultGain: 0.55,
      maxConcurrentVoices: 4,
    },
    interface: {
      enabledByDefault: true,
      defaultGain: 0.5,
      maxConcurrentVoices: 6,
    },
    gameplay: {
      enabledByDefault: true,
      defaultGain: 0.7,
      maxConcurrentVoices: 4,
    },
    achievements: {
      enabledByDefault: true,
      defaultGain: 0.75,
      maxConcurrentVoices: 3,
    },
  },
} as const satisfies AudioPolicySet;
