/**
 * Artifact ID: QCQ-TBL-023
 * Artifact Name: XPManager
 * Repository Path: QCQ/frontend/src/gameplay/XPManager.ts
 */

import type { GameplayEvidenceEvent } from './GameplayStore';

export type XPAwardReason =
  | 'correct-answer'
  | 'incorrect-answer-participation'
  | 'first-attempt-correct'
  | 'streak-milestone'
  | 'session-completion';

export interface XPPolicy {
  readonly policyVersion: string;
  readonly correctAnswerXP: number;
  readonly incorrectAnswerParticipationXP: number;
  readonly firstAttemptCorrectBonusXP: number;
  readonly sessionCompletionXP: number;
  readonly streakMilestones: Readonly<Record<number, number>>;
}

export interface XPAward {
  readonly awardId: string;
  readonly sourceEventId: string;
  readonly sessionId: string;
  readonly questionId: string | null;
  readonly reason: XPAwardReason;
  readonly amount: number;
  readonly occurredAt: string;
  readonly policyVersion: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}

export interface XPSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly policyVersion: string;
  readonly totalXP: number;
  readonly sessionXP: number;
  readonly awardCount: number;
  readonly awards: readonly XPAward[];
  readonly calculatedAt: string;
}

type XPListener = (snapshot: XPSnapshot) => void;

const DEFAULT_XP_POLICY: XPPolicy = Object.freeze({
  policyVersion: 'qcq-xp-v1.0.0',
  correctAnswerXP: 10,
  incorrectAnswerParticipationXP: 0,
  firstAttemptCorrectBonusXP: 5,
  sessionCompletionXP: 25,
  streakMilestones: Object.freeze({}),
});

function validateNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}

function resolvePolicy(policy: Partial<XPPolicy> | undefined): XPPolicy {
  const milestones = policy?.streakMilestones ?? DEFAULT_XP_POLICY.streakMilestones;
  for (const [threshold, amount] of Object.entries(milestones)) {
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 2) {
      throw new Error('XP streak-milestone thresholds must be integers of at least 2.');
    }
    validateNonNegativeInteger(amount, `streakMilestones[${threshold}]`);
  }
  const resolved: XPPolicy = {
    policyVersion: policy?.policyVersion?.trim() || DEFAULT_XP_POLICY.policyVersion,
    correctAnswerXP: policy?.correctAnswerXP ?? DEFAULT_XP_POLICY.correctAnswerXP,
    incorrectAnswerParticipationXP:
      policy?.incorrectAnswerParticipationXP ??
      DEFAULT_XP_POLICY.incorrectAnswerParticipationXP,
    firstAttemptCorrectBonusXP:
      policy?.firstAttemptCorrectBonusXP ??
      DEFAULT_XP_POLICY.firstAttemptCorrectBonusXP,
    sessionCompletionXP:
      policy?.sessionCompletionXP ?? DEFAULT_XP_POLICY.sessionCompletionXP,
    streakMilestones: Object.freeze({ ...milestones }),
  };
  validateNonNegativeInteger(resolved.correctAnswerXP, 'correctAnswerXP');
  validateNonNegativeInteger(
    resolved.incorrectAnswerParticipationXP,
    'incorrectAnswerParticipationXP',
  );
  validateNonNegativeInteger(
    resolved.firstAttemptCorrectBonusXP,
    'firstAttemptCorrectBonusXP',
  );
  validateNonNegativeInteger(resolved.sessionCompletionXP, 'sessionCompletionXP');
  return Object.freeze(resolved);
}

function freezeAward(award: XPAward): XPAward {
  return Object.freeze({
    ...award,
    metadata: Object.freeze({ ...award.metadata }),
  });
}

function emptySnapshot(policy: XPPolicy): XPSnapshot {
  return Object.freeze({
    schemaVersion: '1.0.0',
    policyVersion: policy.policyVersion,
    totalXP: 0,
    sessionXP: 0,
    awardCount: 0,
    awards: Object.freeze([]),
    calculatedAt: new Date().toISOString(),
  });
}

export class XPManager {
  public static readonly defaultPolicy = DEFAULT_XP_POLICY;

  private readonly policy: XPPolicy;
  private state: XPSnapshot;
  private listeners = new Set<XPListener>();

  public constructor(policy?: Partial<XPPolicy>) {
    this.policy = resolvePolicy(policy);
    this.state = emptySnapshot(this.policy);
  }

  public readonly getSnapshot = (): XPSnapshot => this.state;
  public readonly getServerSnapshot = (): XPSnapshot => this.state;

  public readonly subscribe = (listener: XPListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public reconcile(
    evidence: readonly GameplayEvidenceEvent[],
    priorLifetimeXP = 0,
    calculatedAt = new Date().toISOString(),
  ): XPSnapshot {
    validateNonNegativeInteger(priorLifetimeXP, 'priorLifetimeXP');
    if (!Number.isFinite(Date.parse(calculatedAt))) {
      throw new Error('XPManager calculatedAt must be an ISO-compatible date-time.');
    }

    const awards: XPAward[] = [];
    const awardIds = new Set<string>();
    const submissionIds = new Set<string>();
    let streak = 0;

    const addAward = (
      event: GameplayEvidenceEvent,
      reason: XPAwardReason,
      amount: number,
      questionId: string | null,
      metadata: Readonly<Record<string, string | number | boolean | null>>,
    ): void => {
      if (amount <= 0) return;
      const awardId = `${event.eventId}:${reason}`;
      if (awardIds.has(awardId)) return;
      awardIds.add(awardId);
      awards.push(
        freezeAward({
          awardId,
          sourceEventId: event.eventId,
          sessionId: event.sessionId,
          questionId,
          reason,
          amount,
          occurredAt: event.occurredAt,
          policyVersion: this.policy.policyVersion,
          metadata,
        }),
      );
    };

    for (const event of [...evidence].sort((left, right) => left.sequence - right.sequence)) {
      if (event.type === 'answer-graded') {
        if (submissionIds.has(event.submissionId)) continue;
        submissionIds.add(event.submissionId);
        if (event.result.isCorrect) {
          streak += 1;
          addAward(
            event,
            'correct-answer',
            this.policy.correctAnswerXP,
            event.questionId,
            { attemptNumber: event.result.attemptNumber, streak },
          );
          if (event.result.attemptNumber === 1) {
            addAward(
              event,
              'first-attempt-correct',
              this.policy.firstAttemptCorrectBonusXP,
              event.questionId,
              { attemptNumber: 1 },
            );
          }
          const milestoneAmount = this.policy.streakMilestones[streak] ?? 0;
          addAward(
            event,
            'streak-milestone',
            milestoneAmount,
            event.questionId,
            { streak },
          );
        } else {
          streak = 0;
          addAward(
            event,
            'incorrect-answer-participation',
            this.policy.incorrectAnswerParticipationXP,
            event.questionId,
            { attemptNumber: event.result.attemptNumber },
          );
        }
      } else if (event.type === 'session-completed') {
        addAward(
          event,
          'session-completion',
          this.policy.sessionCompletionXP,
          null,
          { completedQuestionCount: event.completedQuestionCount },
        );
      }
    }

    const sessionXP = awards.reduce((sum, award) => sum + award.amount, 0);
    this.state = Object.freeze({
      schemaVersion: '1.0.0',
      policyVersion: this.policy.policyVersion,
      totalXP: priorLifetimeXP + sessionXP,
      sessionXP,
      awardCount: awards.length,
      awards: Object.freeze(awards),
      calculatedAt,
    });
    this.notify();
    return this.state;
  }

  public restore(snapshot: XPSnapshot): XPSnapshot {
    const schemaVersion: string =
      snapshot.schemaVersion;

    if (schemaVersion !== '1.0.0') {
      throw new Error(`Unsupported XP snapshot schema "${schemaVersion}".`);
    }
    if (snapshot.policyVersion !== this.policy.policyVersion) {
      throw new Error('XP snapshot policy version does not match the active XP policy.');
    }
    if (new Set(snapshot.awards.map((award) => award.awardId)).size !== snapshot.awards.length) {
      throw new Error('XP snapshot contains duplicate award IDs.');
    }
    const sessionXP = snapshot.awards.reduce((sum, award) => sum + award.amount, 0);
    if (sessionXP !== snapshot.sessionXP || snapshot.awardCount !== snapshot.awards.length) {
      throw new Error('XP snapshot totals do not reconcile with its award ledger.');
    }
    this.state = Object.freeze({
      ...snapshot,
      awards: Object.freeze(snapshot.awards.map(freezeAward)),
    });
    this.notify();
    return this.state;
  }

  public reset(): XPSnapshot {
    this.state = emptySnapshot(this.policy);
    this.notify();
    return this.state;
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}
