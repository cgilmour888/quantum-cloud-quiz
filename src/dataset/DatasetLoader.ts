/**
 * Artifact ID: QCQ-TBL-016
 * Artifact Name: DatasetLoader
 * Repository Path: QCQ/frontend/src/dataset/DatasetLoader.ts
 */

export type DatasetStatus = 'draft' | 'review' | 'approved' | 'deprecated';
export type DatasetContentType = 'practice' | 'simulation' | 'review' | 'mixed';
export type QuestionSelectionType = 'single' | 'multiple';
export type QuestionDifficulty = 'foundational' | 'intermediate' | 'advanced' | 'unknown';

export interface DatasetProvider {
  readonly id: string;
  readonly name: string;
  readonly website?: string | undefined;
  readonly relationship?: 'exam-provider' | 'publisher' | 'training-provider' | 'community' | 'user-authored' | 'unknown' | undefined;
  readonly trademarkNotice?: string | null | undefined;
}

export interface DatasetExamFamily {
  readonly id: string;
  readonly name: string;
  readonly examCodes: readonly string[];
  readonly official: boolean;
}

export interface DatasetReference {
  readonly id: string;
  readonly url: string;
  readonly title?: string | undefined;
  readonly publisher?: string | undefined;
  readonly verified?: boolean | undefined;
}

export interface DatasetSourceMetadata {
  readonly sourceFile?: string | undefined;
  readonly sourceArchive?: string | undefined;
  readonly sourceQuestionId?: string | number | undefined;
  readonly sourceNumber?: number | undefined;
  readonly importedAt?: string | undefined;
  readonly provenance?: string | undefined;
  readonly extensions?: Readonly<Record<string, unknown>> | undefined;
}

export interface CanonicalQuestionOption {
  readonly id: string;
  readonly sourceKey?: string | undefined;
  readonly text: string;
  readonly sourceMetadata: DatasetSourceMetadata;
}

export interface CanonicalQuestion {
  readonly id: string;
  readonly examId: string;
  readonly number: number;
  readonly prompt: string;
  readonly options: readonly CanonicalQuestionOption[];
  readonly correctAnswers: readonly string[];
  readonly selectionType: QuestionSelectionType;
  readonly selectionCount: number;
  readonly topic: string;
  readonly subtopic: string | null;
  readonly explanation: string | null;
  readonly references: readonly DatasetReference[];
  readonly difficulty: QuestionDifficulty;
  readonly sourceMetadata: DatasetSourceMetadata;
  readonly version: string;
}

export interface DatasetExamProfile {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string | null;
  readonly questionRefs: readonly string[];
  readonly questionCount: number;
  readonly selectionMode: 'ordered' | 'shuffle';
  readonly durationSeconds: number | null;
  readonly passingThreshold: number | null;
  readonly explanationPolicy: 'after-grade' | 'after-session' | 'never';
  readonly pausePolicy: 'allowed' | 'prohibited';
  readonly sourceMetadata: DatasetSourceMetadata;
}

export interface DatasetTaxonomy {
  readonly topics: Readonly<Record<string, { readonly name: string; readonly questionCount: number }>>;
  readonly subtopics: Readonly<Record<string, { readonly name: string; readonly questionCount: number }>>;
}

export interface QCQDataset {
  readonly schemaVersion: string;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly title: string;
  readonly provider: DatasetProvider;
  readonly examFamily: DatasetExamFamily;
  readonly language: string;
  readonly status: DatasetStatus;
  readonly contentType: DatasetContentType;
  readonly description: string | null;
  readonly examProfiles: readonly DatasetExamProfile[];
  readonly taxonomy: DatasetTaxonomy;
  readonly questions: readonly CanonicalQuestion[];
  readonly sourceMetadata: DatasetSourceMetadata;
  readonly licenseMetadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly checksum: { readonly algorithm: 'sha256' | 'fnv1a64'; readonly value: string };
  readonly extensions?: Readonly<Record<string, unknown>> | undefined;
}

export type DatasetIssueSeverity = 'error' | 'warning' | 'information';
export interface DatasetIssue {
  readonly severity: DatasetIssueSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
}

export interface DatasetLoadStatistics {
  readonly examCount: number;
  readonly questionCount: number;
  readonly optionCount: number;
  readonly topicCount: number;
  readonly singleSelectCount: number;
  readonly multipleSelectCount: number;
  readonly selectTwoCount: number;
  readonly selectThreeCount: number;
  readonly explanationCount: number;
  readonly referenceCount: number;
  readonly duplicatePromptCandidateCount: number;
}

export interface DatasetLoadReport {
  readonly sourceName: string;
  readonly sourceFormat: 'canonical-json' | 'legacy-json' | 'markdown' | 'object';
  readonly startedAt: string;
  readonly completedAt: string;
  readonly issues: readonly DatasetIssue[];
  readonly statistics: DatasetLoadStatistics;
  readonly canActivate: boolean;
}

export interface DatasetPreparation {
  readonly dataset: QCQDataset | null;
  readonly report: DatasetLoadReport;
  readonly sourceFingerprint: string;
}

export interface DatasetActivationTarget {
  replaceDataset(dataset: QCQDataset, report: DatasetLoadReport): void | Promise<void>;
}

export interface DatasetLoadProgress {
  readonly phase: 'reading' | 'detecting' | 'parsing' | 'normalizing' | 'validating' | 'indexing' | 'ready';
  readonly completed: number;
  readonly total: number;
  readonly message: string;
}

export interface DatasetLoadOptions {
  readonly sourceName?: string | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly strict?: boolean | undefined;
  readonly expectedDatasetId?: string | undefined;
  readonly onProgress?: ((progress: DatasetLoadProgress) => void) | undefined;
}

export class DatasetLoadError extends Error {
  public readonly report: DatasetLoadReport;
  public constructor(message: string, report: DatasetLoadReport) {
    super(message);
    this.name = 'DatasetLoadError';
    this.report = report;
  }
}

interface RawExam {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly questions: readonly unknown[];
  readonly sourceMetadata: DatasetSourceMetadata;
}

interface NormalizationContext {
  readonly sourceName: string;
  readonly importedAt: string;
  readonly issues: DatasetIssue[];
}

const CANONICAL_ROOT_FIELDS = new Set([
  'schemaVersion', 'datasetId', 'datasetVersion', 'title', 'provider', 'examFamily', 'language', 'status',
  'contentType', 'description', 'examProfiles', 'taxonomy', 'questions', 'sourceMetadata', 'licenseMetadata',
  'createdAt', 'updatedAt', 'checksum', 'extensions',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map(asString).filter((item): item is string => item !== null) : [];
}

function normalizeWhitespace(value: string): string { return value.replace(/\s+/gu, ' ').trim(); }
function slugify(value: string): string {
  return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '') || 'dataset';
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

async function checksumText(value: string): Promise<{ algorithm: 'sha256' | 'fnv1a64'; value: string }> {
  try {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return { algorithm: 'sha256', value: [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('') };
  } catch {
    return { algorithm: 'fnv1a64', value: fnv1a64(value) };
  }
}

function safeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Dataset loading was aborted.', 'AbortError');
}

function emitProgress(options: DatasetLoadOptions, phase: DatasetLoadProgress['phase'], completed: number, total: number, message: string): void {
  options.onProgress?.({ phase, completed, total, message });
}

async function readSource(source: unknown, options: DatasetLoadOptions): Promise<{ value: unknown; text: string | null }> {
  throwIfAborted(options.signal);
  emitProgress(options, 'reading', 0, 1, 'Reading dataset source.');
  if (typeof source === 'string') return { value: source, text: source };
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    const text = await source.text();
    throwIfAborted(options.signal);
    return { value: text, text };
  }
  if (source instanceof ArrayBuffer) return { value: source, text: new TextDecoder('utf-8', { fatal: true }).decode(source) };
  if (source instanceof Uint8Array) return { value: source, text: new TextDecoder('utf-8', { fatal: true }).decode(source) };
  return { value: source, text: null };
}

function parseAnswerTokens(value: string): readonly string[] {
  const cleaned = value.toUpperCase().replace(/[^A-Z,\s]/gu, ' ').trim();
  if (!cleaned) return [];
  const separated = cleaned.split(/[\s,]+/u).filter(Boolean);
  return separated.length === 1 && separated[0]!.length > 1 ? [...separated[0]!] : separated;
}

function parseMarkdownExam(text: string, sourceName: string, context: NormalizationContext): readonly RawExam[] {
  const matches = [...text.matchAll(/^\s*(\d+)\.\s+(.+)$/gmu)];
  const questions: unknown[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? matches[index + 1]!.index ?? text.length : text.length;
    const block = text.slice(start, end);
    const number = Number(match[1]);
    const prompt = normalizeWhitespace(match[2] ?? '');
    const options = [...block.matchAll(/^\s*-\s*([A-Z])\.\s+(.+)$/gmu)].map((option) => ({ key: option[1], text: normalizeWhitespace(option[2] ?? '') }));
    const answerMatch = /Correct Answer:\s*([^\n<]+)/iu.exec(block);
    const answers = answerMatch ? parseAnswerTokens(answerMatch[1] ?? '') : [];
    const explanationMatch = /Explanation:\s*([\s\S]*?)(?=\n\s*Reference:|\n\s*<\/details>|$)/iu.exec(block);
    const explanation = explanationMatch ? normalizeWhitespace((explanationMatch[1] ?? '').replace(/^\s*-\s*/gmu, ' ')) : '';
    const references = [...block.matchAll(/Reference:\s*<?(https?:\/\/[^>\s]+)>?/giu)].map((item) => item[1] ?? '').filter(Boolean);
    if (options.length < 2) context.issues.push({ severity: 'error', code: 'markdown-options-missing', path: `questions[${index}]`, message: `Question ${number} does not contain at least two parseable options.` });
    questions.push({ id: `q${number}`, number, prompt, options, answers, selectionType: answers.length === 1 ? 'single' : 'multiple', selectionCount: answers.length, topic: 'Unclassified', explanation, references, sourceNumber: number });
  }
  if (questions.length === 0) context.issues.push({ severity: 'error', code: 'markdown-question-parse-failed', path: '$', message: 'No numbered Markdown questions were detected.' });
  const slug = slugify(sourceName.replace(/\.[^.]+$/u, ''));
  return [{ id: slug, slug, title: sourceName.replace(/\.[^.]+$/u, ''), questions, sourceMetadata: { sourceFile: sourceName } }];
}

function normalizeExam(exam: unknown, index: number, sourceName: string): RawExam {
  const record = isRecord(exam) ? exam : {};
  const id = asString(record.id) ?? asString(record.slug) ?? `exam-${index + 1}`;
  return {
    id,
    title: asString(record.title) ?? `Exam ${index + 1}`,
    slug: asString(record.slug) ?? slugify(id),
    questions: Array.isArray(record.questions) ? record.questions : [],
    sourceMetadata: { sourceFile: sourceName, provenance: 'normalized-from-source-exam' },
  };
}

function extractRawExams(root: unknown, sourceName: string): readonly RawExam[] {
  if (Array.isArray(root)) return root.map((exam, index) => normalizeExam(exam, index, sourceName));
  if (!isRecord(root)) return [];
  if (Array.isArray(root.exams)) return root.exams.map((exam, index) => normalizeExam(exam, index, sourceName));
  if (isRecord(root.dataset) && Array.isArray(root.dataset.exams)) return root.dataset.exams.map((exam, index) => normalizeExam(exam, index, sourceName));
  if (isRecord(root.exam)) return [normalizeExam(root.exam, 0, sourceName)];
  if (Array.isArray(root.questions)) {
    const groups = new Map<string, unknown[]>();
    for (const question of root.questions) {
      const examId = isRecord(question) ? asString(question.examId) ?? 'exam-1' : 'exam-1';
      const bucket = groups.get(examId) ?? [];
      bucket.push(question);
      groups.set(examId, bucket);
    }
    return [...groups.entries()].map(([examId, questions], index) => normalizeExam({ id: examId, title: `Exam ${index + 1}`, slug: slugify(examId), questions }, index, sourceName));
  }
  return [];
}

function inferProvider(title: string, root: Record<string, unknown>): DatasetProvider {
  const record = isRecord(root.provider) ? root.provider : isRecord(root.meta) && isRecord(root.meta.provider) ? root.meta.provider : null;
  if (record) return { id: slugify(asString(record.id) ?? asString(record.name) ?? 'unknown'), name: asString(record.name) ?? 'Unknown Provider', website: asString(record.website) ?? undefined, relationship: 'exam-provider' };
  if (/\bAWS\b|Amazon Web Services/iu.test(title)) return { id: 'aws', name: 'Amazon Web Services', website: 'https://aws.amazon.com/', relationship: 'exam-provider' };
  return { id: 'unknown', name: 'Unknown Provider', relationship: 'unknown' };
}

function stableQuestionId(datasetId: string, sourceId: string): string { return `${datasetId}.q.${slugify(sourceId)}`; }
function stableOptionId(questionId: string, text: string): string { return `${questionId}.o.${fnv1a64(normalizeWhitespace(text).toLowerCase())}`; }

function normalizeReference(questionId: string, value: unknown, index: number, issues: DatasetIssue[]): DatasetReference | null {
  const url = typeof value === 'string' ? value.trim() : isRecord(value) ? asString(value.url) : null;
  if (!url) return null;
  if (!safeUrl(url)) {
    issues.push({ severity: 'error', code: 'unsafe-reference-url', path: `${questionId}.references[${index}]`, message: `Reference URL "${url}" is not a safe HTTP(S) URL.` });
    return null;
  }
  return { id: `${questionId}.r.${index + 1}`, url, title: isRecord(value) ? asString(value.title) ?? undefined : undefined, publisher: isRecord(value) ? asString(value.publisher) ?? undefined : undefined, verified: isRecord(value) && typeof value.verified === 'boolean' ? value.verified : undefined };
}

function normalizeQuestion(raw: unknown, exam: RawExam, index: number, datasetId: string, context: NormalizationContext): CanonicalQuestion {
  const record = isRecord(raw) ? raw : {};
  const sourceId = asString(record.id) ?? `${exam.id}-q${index + 1}`;
  const id = sourceId.startsWith(`${datasetId}.q.`) ? sourceId : stableQuestionId(datasetId, `${exam.id}-${sourceId}`);
  const prompt = isRecord(record.prompt) ? asString(record.prompt.text) ?? '' : asString(record.prompt) ?? '';
  const rawOptions = Array.isArray(record.options) ? record.options : [];
  const keyMap = new Map<string, string>();
  const options = rawOptions.map((rawOption): CanonicalQuestionOption => {
    const option = isRecord(rawOption) ? rawOption : {};
    const text = isRecord(option.content) ? asString(option.content.text) ?? '' : asString(option.text) ?? '';
    const sourceKey = asString(option.sourceKey) ?? asString(option.key) ?? asString(option.label) ?? undefined;
    const suppliedId = asString(option.id);
    const optionId = suppliedId && suppliedId.startsWith(`${id}.o.`) ? suppliedId : stableOptionId(id, text);
    if (sourceKey) keyMap.set(sourceKey.toUpperCase(), optionId);
    keyMap.set(optionId, optionId);
    return { id: optionId, sourceKey, text, sourceMetadata: { sourceFile: context.sourceName, sourceQuestionId: sourceId } };
  });
  const rawAnswers = Array.isArray(record.correctAnswers) ? asStringArray(record.correctAnswers) : Array.isArray(record.answers) ? asStringArray(record.answers) : asString(record.answer) ? parseAnswerTokens(asString(record.answer) ?? '') : [];
  const correctAnswers = rawAnswers.map((answer) => keyMap.get(answer.toUpperCase()) ?? keyMap.get(answer) ?? '').filter(Boolean);
  const declaredCount = asNumber(record.selectionCount);
  const selectionCount = declaredCount === null ? correctAnswers.length : Math.trunc(declaredCount);
  const declaredType = asString(record.selectionType);
  const selectionType: QuestionSelectionType = declaredType === 'single' || declaredType === 'multiple' ? declaredType : selectionCount === 1 ? 'single' : 'multiple';
  const references = (Array.isArray(record.references) ? record.references : []).map((value, refIndex) => normalizeReference(id, value, refIndex, context.issues)).filter((value): value is DatasetReference => value !== null);
  const difficultyValue = asString(record.difficulty);
  const difficulty: QuestionDifficulty = difficultyValue === 'foundational' || difficultyValue === 'intermediate' || difficultyValue === 'advanced' ? difficultyValue : 'unknown';
  return {
    id,
    examId: exam.id,
    number: Math.trunc(asNumber(record.number) ?? index + 1),
    prompt,
    options,
    correctAnswers,
    selectionType,
    selectionCount,
    topic: asString(record.topic) ?? 'Unclassified',
    subtopic: asString(record.subtopic),
    explanation: asString(record.explanation),
    references,
    difficulty,
    sourceMetadata: { sourceFile: context.sourceName, sourceQuestionId: sourceId, sourceNumber: asNumber(record.sourceNumber) ?? asNumber(record.number) ?? index + 1, importedAt: context.importedAt },
    version: asString(record.version) ?? '1.0.0',
  };
}

function buildTaxonomy(questions: readonly CanonicalQuestion[]): DatasetTaxonomy {
  const topics: Record<string, { name: string; questionCount: number }> = {};
  const subtopics: Record<string, { name: string; questionCount: number }> = {};
  for (const question of questions) {
    const topicId = slugify(question.topic);
    topics[topicId] = { name: question.topic, questionCount: (topics[topicId]?.questionCount ?? 0) + 1 };
    if (question.subtopic) {
      const subtopicId = `${topicId}.${slugify(question.subtopic)}`;
      subtopics[subtopicId] = { name: question.subtopic, questionCount: (subtopics[subtopicId]?.questionCount ?? 0) + 1 };
    }
  }
  return { topics, subtopics };
}

function validateDataset(dataset: QCQDataset, issues: DatasetIssue[], strict: boolean): void {
  const questionIds = new Set<string>();
  const profileIds = new Set<string>();
  const promptMap = new Map<string, string>();
  for (const profile of dataset.examProfiles) {
    if (profileIds.has(profile.id)) issues.push({ severity: 'error', code: 'duplicate-exam-profile-id', path: profile.id, message: `Duplicate exam profile ID "${profile.id}".` });
    profileIds.add(profile.id);
    if (profile.questionCount !== profile.questionRefs.length) issues.push({ severity: 'error', code: 'profile-question-count-mismatch', path: profile.id, message: 'Exam profile questionCount does not match questionRefs length.' });
  }
  for (const question of dataset.questions) {
    if (questionIds.has(question.id)) issues.push({ severity: 'error', code: 'duplicate-question-id', path: question.id, message: `Duplicate question ID "${question.id}".` });
    questionIds.add(question.id);
    if (!question.prompt) issues.push({ severity: 'error', code: 'empty-prompt', path: question.id, message: 'Question prompt is empty.' });
    if (question.prompt.length > 1200) issues.push({ severity: strict ? 'error' : 'warning', code: 'question-content-long', path: question.id, message: 'Question prompt exceeds 1,200 characters.' });
    if (question.options.length < 2) issues.push({ severity: 'error', code: 'insufficient-options', path: question.id, message: 'Question has fewer than two options.' });
    const optionIds = new Set<string>();
    const optionTexts = new Set<string>();
    for (const option of question.options) {
      if (optionIds.has(option.id)) issues.push({ severity: 'error', code: 'duplicate-option-id', path: question.id, message: `Duplicate option ID "${option.id}".` });
      optionIds.add(option.id);
      const normalizedText = normalizeWhitespace(option.text).toLowerCase();
      if (!normalizedText) issues.push({ severity: 'error', code: 'empty-option', path: option.id, message: 'Answer option text is empty.' });
      if (optionTexts.has(normalizedText)) issues.push({ severity: 'warning', code: 'duplicate-option-text', path: question.id, message: 'Question contains repeated option text.' });
      optionTexts.add(normalizedText);
      if (option.text.length > 800) issues.push({ severity: strict ? 'error' : 'warning', code: 'option-content-long', path: option.id, message: 'Answer option exceeds 800 characters.' });
    }
    if (new Set(question.correctAnswers).size !== question.correctAnswers.length) issues.push({ severity: 'error', code: 'duplicate-correct-answer', path: question.id, message: 'Correct-answer set contains duplicate IDs.' });
    if (question.correctAnswers.length === 0) issues.push({ severity: 'error', code: 'empty-answer-key', path: question.id, message: 'Answer set is empty.' });
    for (const answerId of question.correctAnswers) if (!optionIds.has(answerId)) issues.push({ severity: 'error', code: 'answer-option-missing', path: question.id, message: `Correct answer "${answerId}" does not resolve to an option.` });
    if (question.selectionCount !== question.correctAnswers.length) issues.push({ severity: 'error', code: 'selection-count-mismatch', path: question.id, message: 'selectionCount does not match the number of correct answers.' });
    if (question.selectionType === 'single' && question.selectionCount !== 1) issues.push({ severity: 'error', code: 'single-selection-invalid', path: question.id, message: 'Single-select question must have exactly one correct answer.' });
    if (question.selectionType === 'multiple' && question.selectionCount < 2) issues.push({ severity: 'error', code: 'multiple-selection-invalid', path: question.id, message: 'Multiple-select question must require at least two answers.' });
    const fingerprint = normalizeWhitespace(question.prompt).toLowerCase();
    const prior = promptMap.get(fingerprint);
    if (prior) issues.push({ severity: 'warning', code: 'duplicate-prompt-candidate', path: question.id, message: `Prompt duplicates or closely repeats question "${prior}".` });
    else if (fingerprint) promptMap.set(fingerprint, question.id);
    if (!question.explanation) issues.push({ severity: 'warning', code: 'missing-explanation', path: question.id, message: 'Question has no explanation.' });
  }
  for (const profile of dataset.examProfiles) for (const questionRef of profile.questionRefs) if (!questionIds.has(questionRef)) issues.push({ severity: 'error', code: 'profile-question-ref-missing', path: profile.id, message: `Question reference "${questionRef}" does not resolve.` });
}

function statistics(dataset: QCQDataset | null, issues: readonly DatasetIssue[]): DatasetLoadStatistics {
  const questions = dataset?.questions ?? [];
  return {
    examCount: dataset?.examProfiles.length ?? 0,
    questionCount: questions.length,
    optionCount: questions.reduce((sum, question) => sum + question.options.length, 0),
    topicCount: dataset ? Object.keys(dataset.taxonomy.topics).length : 0,
    singleSelectCount: questions.filter((question) => question.selectionType === 'single').length,
    multipleSelectCount: questions.filter((question) => question.selectionType === 'multiple').length,
    selectTwoCount: questions.filter((question) => question.selectionCount === 2).length,
    selectThreeCount: questions.filter((question) => question.selectionCount === 3).length,
    explanationCount: questions.filter((question) => Boolean(question.explanation)).length,
    referenceCount: questions.reduce((sum, question) => sum + question.references.length, 0),
    duplicatePromptCandidateCount: issues.filter((issue) => issue.code === 'duplicate-prompt-candidate').length,
  };
}

async function normalizeRoot(root: unknown, format: DatasetLoadReport['sourceFormat'], context: NormalizationContext, options: DatasetLoadOptions): Promise<QCQDataset | null> {
  const record = isRecord(root) ? root : {};
  const meta = isRecord(record.meta) ? record.meta : {};
  const title = asString(record.title) ?? asString(meta.title) ?? (isRecord(record.dataset) ? asString(record.dataset.title) : null) ?? context.sourceName.replace(/\.[^.]+$/u, '');
  const provider = inferProvider(title, record);
  const examFamilyRecord = isRecord(record.examFamily) ? record.examFamily : {};
  const examFamilyName = asString(examFamilyRecord.name) ?? title;
  const datasetId = asString(record.datasetId) ?? `qcq.${provider.id}.${slugify(examFamilyName)}.practice`;
  const datasetVersion = asString(record.datasetVersion) ?? asString(meta.version) ?? '1.0.0';
  const exams = extractRawExams(root, context.sourceName);
  if (exams.length === 0) {
    context.issues.push({ severity: 'error', code: 'exam-collection-missing', path: '$', message: 'No exam collection or question collection was found.' });
    return null;
  }

  const questions: CanonicalQuestion[] = [];
  const profiles: DatasetExamProfile[] = [];
  const seenExamIds = new Set<string>();
  for (let examIndex = 0; examIndex < exams.length; examIndex += 1) {
    throwIfAborted(options.signal);
    const exam = exams[examIndex]!;
    const examId = slugify(exam.id);
    if (seenExamIds.has(examId)) context.issues.push({ severity: 'error', code: 'duplicate-exam-id', path: `exams[${examIndex}]`, message: `Duplicate exam ID "${examId}".` });
    seenExamIds.add(examId);
    const normalizedExam: RawExam = { ...exam, id: examId };
    const questionRefs: string[] = [];
    for (let questionIndex = 0; questionIndex < exam.questions.length; questionIndex += 1) {
      const question = normalizeQuestion(exam.questions[questionIndex], normalizedExam, questionIndex, datasetId, context);
      questions.push(question);
      questionRefs.push(question.id);
    }
    profiles.push({
      id: `${datasetId}.profile.${slugify(exam.slug)}`,
      slug: slugify(exam.slug),
      title: exam.title,
      description: null,
      questionRefs,
      questionCount: questionRefs.length,
      selectionMode: 'ordered',
      durationSeconds: null,
      passingThreshold: null,
      explanationPolicy: 'after-grade',
      pausePolicy: 'allowed',
      sourceMetadata: exam.sourceMetadata,
    });
    emitProgress(options, 'normalizing', examIndex + 1, exams.length, `Normalized ${exam.title}.`);
  }

  if (format === 'canonical-json' && Array.isArray(record.examProfiles)) {
    profiles.splice(0, profiles.length);
    for (let profileIndex = 0; profileIndex < record.examProfiles.length; profileIndex += 1) {
      const rawProfile: unknown = record.examProfiles[profileIndex];
      const profile = isRecord(rawProfile) ? rawProfile : {};
      const questionRefs = asStringArray(profile.questionRefs);
      profiles.push({
        id: asString(profile.id) ?? `${datasetId}.profile.${profileIndex + 1}`,
        slug: asString(profile.slug) ?? `profile-${profileIndex + 1}`,
        title: asString(profile.title) ?? `Exam ${profileIndex + 1}`,
        description: asString(profile.description),
        questionRefs,
        questionCount: Math.trunc(asNumber(profile.questionCount) ?? questionRefs.length),
        selectionMode: asString(profile.selectionMode) === 'shuffle' ? 'shuffle' : 'ordered',
        durationSeconds: asNumber(profile.durationSeconds),
        passingThreshold: asNumber(profile.passingThreshold),
        explanationPolicy: asString(profile.explanationPolicy) === 'after-session' ? 'after-session' : asString(profile.explanationPolicy) === 'never' ? 'never' : 'after-grade',
        pausePolicy: asString(profile.pausePolicy) === 'prohibited' ? 'prohibited' : 'allowed',
        sourceMetadata: isRecord(profile.sourceMetadata) ? profile.sourceMetadata : { sourceFile: context.sourceName },
      });
    }
  }

  const importedAt = context.importedAt;
  const withoutChecksum = {
    schemaVersion: asString(record.schemaVersion) ?? '1.0.0',
    datasetId,
    datasetVersion,
    title,
    provider,
    examFamily: { id: asString(examFamilyRecord.id) ?? slugify(examFamilyName), name: examFamilyName, examCodes: asStringArray(examFamilyRecord.examCodes), official: examFamilyRecord.official === true },
    language: asString(record.language) ?? 'en-US',
    status: (asString(record.status) ?? 'draft') as DatasetStatus,
    contentType: (asString(record.contentType) ?? 'practice') as DatasetContentType,
    description: asString(record.description),
    examProfiles: profiles,
    taxonomy: buildTaxonomy(questions),
    questions,
    sourceMetadata: { sourceFile: context.sourceName, importedAt, provenance: format },
    licenseMetadata: isRecord(record.licenseMetadata) ? record.licenseMetadata : { rightsStatus: 'unknown' },
    createdAt: asString(record.createdAt) ?? importedAt,
    updatedAt: asString(record.updatedAt) ?? importedAt,
    extensions: isRecord(record.extensions) ? record.extensions : undefined,
  };
  return { ...withoutChecksum, checksum: await checksumText(JSON.stringify(withoutChecksum)) };
}

export class DatasetLoader {
  public async prepare(source: unknown, options: DatasetLoadOptions = {}): Promise<DatasetPreparation> {
    const startedAt = new Date().toISOString();
    const sourceName = options.sourceName ?? (typeof File !== 'undefined' && source instanceof File ? source.name : 'uploaded-dataset');
    const issues: DatasetIssue[] = [];
    const context: NormalizationContext = { sourceName, importedAt: startedAt, issues };
    let sourceFormat: DatasetLoadReport['sourceFormat'] = 'object';
    let sourceFingerprint = '';
    let dataset: QCQDataset | null = null;
    try {
      const loaded = await readSource(source, options);
      throwIfAborted(options.signal);
      emitProgress(options, 'detecting', 0, 1, 'Detecting dataset format.');
      let root: unknown = loaded.value;
      if (loaded.text !== null) {
        const trimmed = loaded.text.trim();
        sourceFingerprint = fnv1a64(trimmed);
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          emitProgress(options, 'parsing', 0, 1, 'Parsing JSON dataset.');
          root = JSON.parse(trimmed) as unknown;
          sourceFormat = isRecord(root) && typeof root.datasetId === 'string' ? 'canonical-json' : 'legacy-json';
        } else {
          emitProgress(options, 'parsing', 0, 1, 'Parsing Markdown exam source.');
          root = { exams: parseMarkdownExam(trimmed, sourceName, context) };
          sourceFormat = 'markdown';
        }
      } else {
        sourceFingerprint = fnv1a64(JSON.stringify(root));
      }
      if (sourceFormat === 'canonical-json' && isRecord(root)) {
        for (const field of Object.keys(root)) if (!CANONICAL_ROOT_FIELDS.has(field)) issues.push({ severity: 'error', code: 'unknown-root-field', path: field, message: `Unknown canonical root field "${field}" must be placed in extensions.` });
      }
      emitProgress(options, 'normalizing', 0, 1, 'Normalizing stable identities and canonical fields.');
      dataset = await normalizeRoot(root, sourceFormat, context, options);
      throwIfAborted(options.signal);
      if (dataset) {
        emitProgress(options, 'validating', 0, dataset.questions.length, 'Validating dataset integrity.');
        validateDataset(dataset, issues, options.strict ?? false);
        if (options.expectedDatasetId && dataset.datasetId !== options.expectedDatasetId) issues.push({ severity: 'error', code: 'dataset-id-mismatch', path: 'datasetId', message: `Expected dataset ID "${options.expectedDatasetId}" but received "${dataset.datasetId}".` });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      issues.push({ severity: 'error', code: 'dataset-parse-failed', path: '$', message: error instanceof Error ? error.message : 'Dataset parsing failed for an unknown reason.' });
      dataset = null;
    }
    const report: DatasetLoadReport = {
      sourceName,
      sourceFormat,
      startedAt,
      completedAt: new Date().toISOString(),
      issues: Object.freeze([...issues]),
      statistics: statistics(dataset, issues),
      canActivate: dataset !== null && !issues.some((issue) => issue.severity === 'error'),
    };
    emitProgress(options, 'ready', 1, 1, report.canActivate ? 'Dataset is ready for activation.' : 'Dataset was rejected.');
    return { dataset, report, sourceFingerprint };
  }

  public async activate(preparation: DatasetPreparation, target: DatasetActivationTarget): Promise<void> {
    if (!preparation.report.canActivate || preparation.dataset === null) throw new DatasetLoadError('Dataset activation was rejected because validation errors remain.', preparation.report);
    await target.replaceDataset(preparation.dataset, preparation.report);
  }

  public async loadAndActivate(source: unknown, target: DatasetActivationTarget, options: DatasetLoadOptions = {}): Promise<DatasetPreparation> {
    const preparation = await this.prepare(source, options);
    await this.activate(preparation, target);
    return preparation;
  }
}
