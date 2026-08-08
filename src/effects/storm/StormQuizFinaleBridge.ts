/**
 * Owner Authorities: QCQ-TBL-021 / QCQ-TBL-022 -> QCQ-TBL-069.
 * Accepts an already-authoritative score projection. It never calculates correctness.
 */
import type {QuizFinaleRequest} from './StormOrchestration.types';

export interface AuthoritativeQuizResultProjection {
  readonly quizId:string;
  readonly scorePercent:number;
  readonly completedAt:number;
}
export function createQuizFinaleRequest(
  projection:AuthoritativeQuizResultProjection,
  durationMs?:number,
):QuizFinaleRequest {
  if (projection.quizId.trim().length===0) throw new Error('Quiz finale requires a non-empty quizId.');
  if (!Number.isFinite(projection.scorePercent)) throw new Error('Quiz finale requires a finite authoritative scorePercent.');
  if (!Number.isFinite(projection.completedAt)) throw new Error('Quiz finale requires a finite completedAt timestamp.');
  return Object.freeze({
    quizId:projection.quizId,
    scorePercent:projection.scorePercent,
    completedAt:projection.completedAt,
    ...(durationMs===undefined?{}:{durationMs}),
  });
}
