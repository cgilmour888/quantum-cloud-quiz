/** Owner Authority: QCQ-AUD-017. Subordinate storm/rain semantic vocabulary. */
export const STORM_AUDIO_SEMANTICS=[
  'stormRumble',
  'cloudMurmurPrimary','cloudMurmurRearLeft','cloudMurmurRearRight',
  'cloudFlicker','lightningCrack','thunderPreRoll','thunderClose','thunderDistant','thunderRoll',
  'thunderEchoPrimary','thunderEchoRearLeft','thunderEchoRearRight','thunderDecay',
  'rainBed','rainDropsNear','rainDropsSurface','rainSurge','rainDecay',
] as const;
export type StormAudioSemantic=(typeof STORM_AUDIO_SEMANTICS)[number];
