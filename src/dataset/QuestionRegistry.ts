/**
 * Artifact ID: QCQ-TBL-017
 * Artifact Name: QuestionRegistry
 * Repository Path: QCQ/frontend/src/dataset/QuestionRegistry.ts
 */

import type {
  CanonicalQuestion,
  DatasetActivationTarget,
  DatasetExamProfile,
  DatasetLoadReport,
  QCQDataset,
  QuestionSelectionType,
} from './DatasetLoader';

export interface QuestionRegistrySnapshot {
  readonly revision: number;
  readonly datasetId: string | null;
  readonly datasetVersion: string | null;
  readonly questionCount: number;
  readonly profileCount: number;
  readonly topicCount: number;
}

export interface QuestionQuery {
  readonly examId?: string | undefined;
  readonly profileId?: string | undefined;
  readonly topics?: readonly string[] | undefined;
  readonly subtopics?: readonly string[] | undefined;
  readonly selectionTypes?: readonly QuestionSelectionType[] | undefined;
  readonly hasExplanation?: boolean | undefined;
  readonly hasReferences?: boolean | undefined;
}

export interface DuplicatePromptGroup {
  readonly fingerprint: string;
  readonly questionIds: readonly string[];
}

type RegistryListener = (snapshot: QuestionRegistrySnapshot) => void;

function normalizeForFingerprint(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }

export class QuestionRegistry implements DatasetActivationTarget {
  private dataset: QCQDataset | null = null;
  private revision = 0;
  private questionsById = new Map<string, CanonicalQuestion>();
  private profilesById = new Map<string, DatasetExamProfile>();
  private questionIdsByExam = new Map<string, readonly string[]>();
  private questionIdsByTopic = new Map<string, readonly string[]>();
  private questionIdsBySubtopic = new Map<string, readonly string[]>();
  private questionIdsByPromptFingerprint = new Map<string, readonly string[]>();
  private listeners = new Set<RegistryListener>();
  private lastReport: DatasetLoadReport | null = null;

  public replaceDataset(dataset: QCQDataset, report: DatasetLoadReport): void {
    if (!report.canActivate) throw new Error('QuestionRegistry cannot activate a dataset with validation errors.');

    const nextQuestions = new Map<string, CanonicalQuestion>();
    const nextProfiles = new Map<string, DatasetExamProfile>();
    const examBuckets = new Map<string, string[]>();
    const topicBuckets = new Map<string, string[]>();
    const subtopicBuckets = new Map<string, string[]>();
    const promptBuckets = new Map<string, string[]>();

    for (const question of dataset.questions) {
      if (nextQuestions.has(question.id)) throw new Error(`QuestionRegistry duplicate question ID "${question.id}".`);
      nextQuestions.set(question.id, question);
      const examBucket = examBuckets.get(question.examId) ?? [];
      examBucket.push(question.id);
      examBuckets.set(question.examId, examBucket);
      const topicBucket = topicBuckets.get(question.topic) ?? [];
      topicBucket.push(question.id);
      topicBuckets.set(question.topic, topicBucket);
      if (question.subtopic) {
        const subtopicBucket = subtopicBuckets.get(question.subtopic) ?? [];
        subtopicBucket.push(question.id);
        subtopicBuckets.set(question.subtopic, subtopicBucket);
      }
      const fingerprint = fnv1a64(normalizeForFingerprint(question.prompt));
      const promptBucket = promptBuckets.get(fingerprint) ?? [];
      promptBucket.push(question.id);
      promptBuckets.set(fingerprint, promptBucket);
    }

    for (const profile of dataset.examProfiles) {
      if (nextProfiles.has(profile.id)) throw new Error(`QuestionRegistry duplicate profile ID "${profile.id}".`);
      for (const questionId of profile.questionRefs) if (!nextQuestions.has(questionId)) throw new Error(`Profile "${profile.id}" references missing question "${questionId}".`);
      nextProfiles.set(profile.id, profile);
    }

    const freezeBuckets = (source: Map<string, string[]>): Map<string, readonly string[]> =>
      new Map([...source].map(([key, values]) => [key, freezeArray(values)]));

    this.dataset = dataset;
    this.questionsById = nextQuestions;
    this.profilesById = nextProfiles;
    this.questionIdsByExam = freezeBuckets(examBuckets);
    this.questionIdsByTopic = freezeBuckets(topicBuckets);
    this.questionIdsBySubtopic = freezeBuckets(subtopicBuckets);
    this.questionIdsByPromptFingerprint = freezeBuckets(promptBuckets);
    this.lastReport = report;
    this.revision += 1;
    this.notify();
  }

  public clear(): void {
    this.dataset = null;
    this.questionsById.clear();
    this.profilesById.clear();
    this.questionIdsByExam.clear();
    this.questionIdsByTopic.clear();
    this.questionIdsBySubtopic.clear();
    this.questionIdsByPromptFingerprint.clear();
    this.lastReport = null;
    this.revision += 1;
    this.notify();
  }

  public getDataset(): QCQDataset {
    if (!this.dataset) throw new Error('QuestionRegistry has no active dataset.');
    return this.dataset;
  }

  public getLastLoadReport(): DatasetLoadReport | null { return this.lastReport; }
  public hasQuestion(questionId: string): boolean { return this.questionsById.has(questionId); }

  public getQuestion(questionId: string): CanonicalQuestion {
    const question = this.questionsById.get(questionId);
    if (!question) throw new Error(`QuestionRegistry could not resolve question "${questionId}".`);
    return question;
  }

  public getProfile(profileId: string): DatasetExamProfile {
    const profile = this.profilesById.get(profileId);
    if (!profile) throw new Error(`QuestionRegistry could not resolve profile "${profileId}".`);
    return profile;
  }

  public listProfiles(): readonly DatasetExamProfile[] { return freezeArray([...this.profilesById.values()]); }
  public listQuestions(): readonly CanonicalQuestion[] { return freezeArray([...this.questionsById.values()]); }
  public listByExam(examId: string): readonly CanonicalQuestion[] { return freezeArray((this.questionIdsByExam.get(examId) ?? []).map((id) => this.getQuestion(id))); }
  public listByTopic(topic: string): readonly CanonicalQuestion[] { return freezeArray((this.questionIdsByTopic.get(topic) ?? []).map((id) => this.getQuestion(id))); }
  public listBySubtopic(subtopic: string): readonly CanonicalQuestion[] { return freezeArray((this.questionIdsBySubtopic.get(subtopic) ?? []).map((id) => this.getQuestion(id))); }

  public query(query: QuestionQuery): readonly CanonicalQuestion[] {
    const profileIds = query.profileId ? new Set(this.getProfile(query.profileId).questionRefs) : null;
    const topics = query.topics ? new Set(query.topics) : null;
    const subtopics = query.subtopics ? new Set(query.subtopics) : null;
    const selectionTypes = query.selectionTypes ? new Set(query.selectionTypes) : null;
    return freezeArray([...this.questionsById.values()].filter((question) => {
      if (query.examId && question.examId !== query.examId) return false;
      if (profileIds && !profileIds.has(question.id)) return false;
      if (topics && !topics.has(question.topic)) return false;
      if (subtopics && (!question.subtopic || !subtopics.has(question.subtopic))) return false;
      if (selectionTypes && !selectionTypes.has(question.selectionType)) return false;
      if (query.hasExplanation !== undefined && Boolean(question.explanation) !== query.hasExplanation) return false;
      if (query.hasReferences !== undefined && (question.references.length > 0) !== query.hasReferences) return false;
      return true;
    }));
  }

  public duplicatePromptGroups(): readonly DuplicatePromptGroup[] {
    return freezeArray([...this.questionIdsByPromptFingerprint.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([fingerprint, questionIds]) => ({ fingerprint, questionIds })));
  }

  public snapshot(): QuestionRegistrySnapshot {
    return Object.freeze({
      revision: this.revision,
      datasetId: this.dataset?.datasetId ?? null,
      datasetVersion: this.dataset?.datasetVersion ?? null,
      questionCount: this.questionsById.size,
      profileCount: this.profilesById.size,
      topicCount: this.questionIdsByTopic.size,
    });
  }

  public subscribe(listener: RegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
