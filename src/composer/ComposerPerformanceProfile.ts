/**
 * Artifact ID: QCQ-CMP-019
 * Artifact Name: ComposerPerformanceProfile
 * Artifact Purpose: Composition performance budgets and rolling observation engine for frame time, long tasks, memory pressure, dropped frames, and optional visual cost.
 * Artifact Layer: Phase 10 — Master Composer / PRF (Performance Authority)
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-CMP-016, QCQ-CMP-020
 * Dependency Graph: None -> ComposerPerformanceProfile -> QCQ-CMP-016, QCQ-CMP-020
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerPerformanceProfile.ts
 */

export type ComposerPerformanceTier = 'ultra' | 'high' | 'balanced' | 'reduced';

export interface ComposerPerformanceBudget {
  readonly tier: ComposerPerformanceTier;
  readonly targetFps: number;
  readonly maximumFrameTimeMs: number;
  readonly maximumP95FrameTimeMs: number;
  readonly maximumLongTasksPerMinute: number;
  readonly maximumDroppedFrameRatio: number;
  readonly maximumHeapGrowthMbPerHour: number;
}

export interface ComposerPerformanceSample {
  readonly capturedAt: number;
  readonly frameTimeMs: number;
  readonly longTaskCount: number;
  readonly droppedFrameRatio: number;
  readonly heapUsedMb: number | null;
}

export interface ComposerPerformanceSnapshot {
  readonly sampleCount: number;
  readonly averageFrameTimeMs: number;
  readonly p95FrameTimeMs: number;
  readonly averageDroppedFrameRatio: number;
  readonly longTaskCount: number;
  readonly heapDeltaMb: number | null;
  readonly withinBudget: boolean;
  readonly violations: readonly string[];
}

export const COMPOSER_PERFORMANCE_BUDGETS: Readonly<Record<ComposerPerformanceTier, ComposerPerformanceBudget>> = Object.freeze({
  ultra: Object.freeze({ tier:'ultra', targetFps:60, maximumFrameTimeMs:18, maximumP95FrameTimeMs:24, maximumLongTasksPerMinute:6, maximumDroppedFrameRatio:0.06, maximumHeapGrowthMbPerHour:64 }),
  high: Object.freeze({ tier:'high', targetFps:60, maximumFrameTimeMs:20, maximumP95FrameTimeMs:28, maximumLongTasksPerMinute:8, maximumDroppedFrameRatio:0.08, maximumHeapGrowthMbPerHour:64 }),
  balanced: Object.freeze({ tier:'balanced', targetFps:45, maximumFrameTimeMs:27, maximumP95FrameTimeMs:38, maximumLongTasksPerMinute:10, maximumDroppedFrameRatio:0.12, maximumHeapGrowthMbPerHour:48 }),
  reduced: Object.freeze({ tier:'reduced', targetFps:30, maximumFrameTimeMs:38, maximumP95FrameTimeMs:55, maximumLongTasksPerMinute:12, maximumDroppedFrameRatio:0.18, maximumHeapGrowthMbPerHour:32 }),
});

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const index=Math.min(sorted.length-1, Math.max(0, Math.ceil(sorted.length*p)-1));
  return sorted[index] ?? 0;
}

export class ComposerPerformanceMonitor {
  private readonly samples: ComposerPerformanceSample[]=[];
  public constructor(private budget: ComposerPerformanceBudget = COMPOSER_PERFORMANCE_BUDGETS.balanced, private readonly maximumSamples=600) {}
  public setBudget(budget: ComposerPerformanceBudget): void { this.budget=budget; }
  public observe(sample: ComposerPerformanceSample): ComposerPerformanceSnapshot {
    if (!Number.isFinite(sample.frameTimeMs) || sample.frameTimeMs < 0) throw new Error('frameTimeMs must be finite and non-negative.');
    this.samples.push(Object.freeze({ ...sample }));
    if (this.samples.length>this.maximumSamples) this.samples.splice(0,this.samples.length-this.maximumSamples);
    return this.getSnapshot();
  }
  public getSnapshot(): ComposerPerformanceSnapshot {
    const frameTimes=this.samples.map((s)=>s.frameTimeMs);
    const avg=frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:0;
    const p95=percentile(frameTimes,.95);
    const drop=this.samples.length?this.samples.reduce((a,b)=>a+b.droppedFrameRatio,0)/this.samples.length:0;
    const longTasks=this.samples.reduce((a,b)=>a+b.longTaskCount,0);
    const heap=this.samples.filter((s)=>s.heapUsedMb!==null).map((s)=>s.heapUsedMb as number);
    const heapDelta=heap.length>=2?(heap[heap.length-1]??0)-(heap[0]??0):null;
    const violations:string[]=[];
    if (avg>this.budget.maximumFrameTimeMs) violations.push('average-frame-time');
    if (p95>this.budget.maximumP95FrameTimeMs) violations.push('p95-frame-time');
    if (drop>this.budget.maximumDroppedFrameRatio) violations.push('dropped-frame-ratio');
    if (heapDelta!==null && heapDelta>this.budget.maximumHeapGrowthMbPerHour) violations.push('heap-growth');
    return Object.freeze({ sampleCount:this.samples.length, averageFrameTimeMs:avg, p95FrameTimeMs:p95, averageDroppedFrameRatio:drop, longTaskCount:longTasks, heapDeltaMb:heapDelta, withinBudget:violations.length===0, violations:Object.freeze(violations) });
  }
}
