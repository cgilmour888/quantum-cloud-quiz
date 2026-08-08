/**
 * Artifact ID: QCQ-TBL-018
 * Artifact Name: QuestionSessionEngine
 * Repository Path: QCQ/frontend/src/dataset/QuestionSessionEngine.ts
 */

import type { CanonicalQuestion, QuestionSelectionType } from './DatasetLoader';
import { QuestionRegistry, type QuestionQuery } from './QuestionRegistry';

export type QuestionSessionOrder = 'ordered' | 'shuffle';
export type QuestionSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface QuestionSessionSource {
  readonly profileId?: string | undefined;
  readonly examId?: string | undefined;
  readonly questionIds?: readonly string[] | undefined;
}

export interface QuestionSessionFilter {
  readonly topics?: readonly string[] | undefined;
  readonly subtopics?: readonly string[] | undefined;
  readonly selectionTypes?: readonly QuestionSelectionType[] | undefined;
  readonly hasExplanation?: boolean | undefined;
  readonly hasReferences?: boolean | undefined;
}

export interface QuestionSessionConfiguration {
  readonly source: QuestionSessionSource;
  readonly filter?: QuestionSessionFilter | undefined;
  readonly order?: QuestionSessionOrder | undefined;
  readonly questionLimit?: number | undefined;
  readonly seed?: string | undefined;
  readonly sessionId?: string | undefined;
  readonly startedAt?: string | undefined;
  readonly durationSeconds?: number | null | undefined;
  readonly passingThreshold?: number | null | undefined;
}

export interface QuestionSessionSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly sessionId: string;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly source: QuestionSessionSource;
  readonly filter: QuestionSessionFilter;
  readonly order: QuestionSessionOrder;
  readonly seed: string;
  readonly questionIds: readonly string[];
  readonly questionCount: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly status: QuestionSessionStatus;
  readonly durationSeconds: number | null;
  readonly passingThreshold: number | null;
}

export interface QuestionSessionMaterialized {
  readonly session: QuestionSessionSnapshot;
  readonly questions: readonly CanonicalQuestion[];
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(values: readonly T[], seed: string): readonly T[] {
  const result = [...values];
  const random = mulberry32(fnv1a32(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const replacement = Math.floor(random() * (index + 1));
    [result[index], result[replacement]] = [result[replacement]!, result[index]!];
  }
  return Object.freeze(result);
}

function createSessionId(): string {
  try {
    return `qcq-session-${globalThis.crypto.randomUUID()}`;
  } catch {
    return `qcq-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function assertIsoDate(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${field} must be an ISO-compatible date-time.`);
}

export class QuestionSessionEngine {
  public constructor(private readonly registry: QuestionRegistry) {}

  public createSession(configuration: QuestionSessionConfiguration): QuestionSessionSnapshot {
    const dataset = this.registry.getDataset();
    const source = configuration.source;
    const sourceCount = [source.profileId, source.examId, source.questionIds].filter((value) => value !== undefined).length;
    if (sourceCount !== 1) throw new Error('QuestionSessionEngine requires exactly one source: profileId, examId, or questionIds.');

    let candidates: readonly CanonicalQuestion[];
    if (source.profileId) candidates = this.registry.getProfile(source.profileId).questionRefs.map((id) => this.registry.getQuestion(id));
    else if (source.examId) candidates = this.registry.listByExam(source.examId);
    else {
      const ids = source.questionIds ?? [];
      if (new Set(ids).size !== ids.length) throw new Error('QuestionSessionEngine questionIds source contains duplicates.');
      candidates = ids.map((id) => this.registry.getQuestion(id));
    }

    const filter = configuration.filter ?? {};
    const query: QuestionQuery = {
      topics: filter.topics,
      subtopics: filter.subtopics,
      selectionTypes: filter.selectionTypes,
      hasExplanation: filter.hasExplanation,
      hasReferences: filter.hasReferences,
    };
    if (Object.values(query).some((value) => value !== undefined)) {
      const allowed = new Set(this.registry.query(query).map((question) => question.id));
      candidates = candidates.filter((question) => allowed.has(question.id));
    }
    if (candidates.length === 0) throw new Error('QuestionSessionEngine source and filters resolved to zero questions.');

    const limit = configuration.questionLimit === undefined ? candidates.length : Math.trunc(configuration.questionLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > candidates.length) throw new Error(`questionLimit must be between 1 and ${candidates.length}.`);
    const order = configuration.order ?? 'ordered';
    const seed = configuration.seed?.trim() || `${dataset.datasetId}|${dataset.datasetVersion}|${configuration.sessionId ?? Date.now()}`;
    const ordered = order === 'shuffle' ? deterministicShuffle(candidates, seed) : candidates;
    const questionIds = Object.freeze(ordered.slice(0, limit).map((question) => question.id));
    const startedAt = configuration.startedAt ?? new Date().toISOString();
    assertIsoDate(startedAt, 'startedAt');

    return Object.freeze({
      schemaVersion: '1.0.0',
      sessionId: configuration.sessionId?.trim() || createSessionId(),
      datasetId: dataset.datasetId,
      datasetVersion: dataset.datasetVersion,
      source: Object.freeze({ ...source }),
      filter: Object.freeze({ ...filter }),
      order,
      seed,
      questionIds,
      questionCount: questionIds.length,
      startedAt,
      updatedAt: startedAt,
      status: 'active',
      durationSeconds: configuration.durationSeconds ?? null,
      passingThreshold: configuration.passingThreshold ?? null,
    });
  }

  public restoreSession(snapshot: QuestionSessionSnapshot): QuestionSessionSnapshot {
    const dataset = this.registry.getDataset();
    const schemaVersion: string = snapshot.schemaVersion;
    if (schemaVersion !== '1.0.0') throw new Error(`Unsupported question-session schema "${schemaVersion}".`);
    if (snapshot.datasetId !== dataset.datasetId || snapshot.datasetVersion !== dataset.datasetVersion) throw new Error('Session dataset identity or version does not match the active registry dataset.');
    if (snapshot.questionIds.length !== snapshot.questionCount || snapshot.questionIds.length === 0) throw new Error('Session questionCount is invalid.');
    if (new Set(snapshot.questionIds).size !== snapshot.questionIds.length) throw new Error('Session contains duplicate question IDs.');
    for (const questionId of snapshot.questionIds) this.registry.getQuestion(questionId);
    assertIsoDate(snapshot.startedAt, 'startedAt');
    assertIsoDate(snapshot.updatedAt, 'updatedAt');
    return Object.freeze({ ...snapshot, source: Object.freeze({ ...snapshot.source }), filter: Object.freeze({ ...snapshot.filter }), questionIds: Object.freeze([...snapshot.questionIds]) });
  }

  public materialize(snapshot: QuestionSessionSnapshot): QuestionSessionMaterialized {
    const session = this.restoreSession(snapshot);
    return Object.freeze({ session, questions: Object.freeze(session.questionIds.map((id) => this.registry.getQuestion(id))) });
  }

  public updateStatus(snapshot: QuestionSessionSnapshot, status: QuestionSessionStatus): QuestionSessionSnapshot {
    const restored = this.restoreSession(snapshot);
    return Object.freeze({ ...restored, status, updatedAt: new Date().toISOString() });
  }
}
