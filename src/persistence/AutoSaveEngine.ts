/**
 * Artifact ID: QCQ-PER-017
 * Artifact Name: AutoSaveEngine
 * Repository Path: QCQ/frontend/src/persistence/AutoSaveEngine.ts
 */

export type AutoSaveTrigger =
  | 'interval'
  | 'question-progressed'
  | 'answer-graded'
  | 'achievement-unlocked'
  | 'session-suspended'
  | 'manual-request';

export interface AutoSavePolicy {
  readonly enabled: boolean;
  readonly intervalMilliseconds: number;
  readonly saveOnQuestionProgression: boolean;
  readonly saveOnAnswerGraded: boolean;
  readonly saveOnAchievementUnlocked: boolean;
  readonly saveOnSuspend: boolean;
  readonly minimumGapMilliseconds: number;
}

export interface AutoSaveRequest {
  readonly trigger: AutoSaveTrigger;
  readonly requestedAt: number;
}

export const DEFAULT_AUTOSAVE_POLICY: AutoSavePolicy = Object.freeze({
  enabled: true,
  intervalMilliseconds: 30_000,
  saveOnQuestionProgression: true,
  saveOnAnswerGraded: true,
  saveOnAchievementUnlocked: true,
  saveOnSuspend: true,
  minimumGapMilliseconds: 2_000,
});

export class AutoSaveEngine {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastSaveAt: number | null = null;
  private running = false;

  public constructor(
    private readonly save: (request: AutoSaveRequest) => Promise<void>,
    private readonly policy: AutoSavePolicy = DEFAULT_AUTOSAVE_POLICY,
    private readonly now: () => number = () => Date.now(),
    private readonly onError: (error: unknown, request: AutoSaveRequest) => void = () => undefined,
  ) {
    if (policy.intervalMilliseconds < 1_000) {
      throw new Error('Autosave interval must be at least one second.');
    }
    if (policy.minimumGapMilliseconds < 0) {
      throw new Error('Autosave minimum gap cannot be negative.');
    }
  }

  public start(): void {
    if (this.running || !this.policy.enabled) return;
    this.running = true;
    this.scheduleInterval();
  }

  public stop(): void {
    this.running = false;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  public async signal(trigger: Exclude<AutoSaveTrigger, 'interval'>): Promise<boolean> {
    if (!this.shouldSaveForTrigger(trigger)) return false;
    return this.execute(trigger);
  }

  public async flush(): Promise<boolean> {
    return this.execute('manual-request', true);
  }

  public getLastSaveAt(): number | null {
    return this.lastSaveAt;
  }

  private shouldSaveForTrigger(trigger: Exclude<AutoSaveTrigger, 'interval'>): boolean {
    if (!this.policy.enabled) return false;
    switch (trigger) {
      case 'question-progressed':
        return this.policy.saveOnQuestionProgression;
      case 'answer-graded':
        return this.policy.saveOnAnswerGraded;
      case 'achievement-unlocked':
        return this.policy.saveOnAchievementUnlocked;
      case 'session-suspended':
        return this.policy.saveOnSuspend;
      case 'manual-request':
        return true;
    }
  }

  private async execute(trigger: AutoSaveTrigger, force = false): Promise<boolean> {
    if (!this.policy.enabled && !force) return false;
    const requestedAt = this.now();
    if (
      !force &&
      this.lastSaveAt !== null &&
      requestedAt - this.lastSaveAt < this.policy.minimumGapMilliseconds
    ) {
      return false;
    }
    await this.save(Object.freeze({ trigger, requestedAt }));
    this.lastSaveAt = this.now();
    return true;
  }

  private scheduleInterval(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      const requestedAt = this.now();
      void this.execute('interval').catch((error: unknown) => {
        this.onError(error, Object.freeze({ trigger: 'interval', requestedAt }));
        return false;
      }).finally(() => this.scheduleInterval());
    }, this.policy.intervalMilliseconds);
  }
}
