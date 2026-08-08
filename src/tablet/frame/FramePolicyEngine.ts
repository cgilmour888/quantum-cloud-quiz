/**
 * Artifact ID: QCQ-TBL-051
 * Artifact Name: FramePolicyEngine
 * Artifact Purpose: Adaptive frame quality, motion, glow, reflection, and energy-rail policy resolution.
 * Artifact Layer: QCQ-TBL — POL
 * Artifact Dependencies: QCQ-TBL-049, QCQ-TBL-052
 * Artifact Dependents: QCQ-TBL-004, QCQ-TBL-008, QCQ-TBL-009
 * Dependency Graph: frame manifest + capabilities -> FramePolicyEngine -> frame renderers
 * Repository Path: QCQ/frontend/src/tablet/frame
 * Source File: FramePolicyEngine.ts
 */

import type { FrameCapabilitiesSnapshot } from './FrameCapabilities';

export type FrameQuality = 'minimal' | 'balanced' | 'cinematic';

export interface FramePolicy {
  readonly quality: FrameQuality;
  readonly renderOuterShell: boolean;
  readonly renderInnerShell: boolean;
  readonly renderCornerNodes: boolean;
  readonly renderEnergyRails: boolean;
  readonly renderGlow: boolean;
  readonly animateEnergy: boolean;
  readonly useBackdropFilter: boolean;
  readonly glowIntensity: number;
  readonly reflectionIntensity: number;
}

export function resolveFramePolicy(
  capabilities: FrameCapabilitiesSnapshot,
  requested: FrameQuality = 'cinematic',
): FramePolicy {
  const forced = capabilities.forcedColors;
  const reduced = capabilities.reducedMotion;

  const quality: FrameQuality =
    forced
      ? 'minimal'
      : requested === 'cinematic' && !capabilities.svg
        ? 'balanced'
        : requested;

  const glowIntensity =
    quality === 'cinematic'
      ? 1
      : quality === 'balanced'
        ? 0.62
        : 0;

  return Object.freeze({
    quality,
    renderOuterShell: true,
    renderInnerShell: true,
    renderCornerNodes: true,
    renderEnergyRails:
      quality !== 'minimal',
    renderGlow:
      quality !== 'minimal',
    animateEnergy:
      !reduced &&
      quality !== 'minimal',
    useBackdropFilter:
      capabilities.backdropFilter &&
      !capabilities.reducedTransparency &&
      !forced,
    glowIntensity,
    reflectionIntensity:
      quality === 'cinematic'
        ? 0.8
        : quality === 'balanced'
          ? 0.4
          : 0,
  });
}
