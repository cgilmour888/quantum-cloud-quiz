import { assetPath } from '../../utils/assetPath.js';
import { normalizeQuizDataset } from './datasetNormalizer.js';
import { validateNormalizedDataset } from './datasetSchema.js';

export class StaticQuestionRepository {
  constructor(url = assetPath('data/aws-cloud-practitioner.exams.json')) {
    this.url = url;
    this.cache = null;
  }

  async load({ force = false } = {}) {
    if (this.cache && !force) return this.cache;

    const response = await fetch(this.url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load question collection (${response.status}).`);
    }

    const raw = await response.json();
    const dataset = normalizeQuizDataset(raw, { source: this.url });
    const validation = validateNormalizedDataset(dataset);

    if (!validation.valid) {
      throw new Error(`Question collection failed validation:\n${validation.errors.join('\n')}`);
    }

    this.cache = dataset;
    return dataset;
  }

  async getExams(options) {
    return (await this.load(options)).exams;
  }

  async getExam(id, options) {
    const exams = await this.getExams(options);
    return exams.find((exam) => String(exam.id) === String(id)) ?? null;
  }
}

export class InMemoryQuestionRepository {
  constructor(value, source = 'memory') {
    this.dataset = normalizeQuizDataset(value, { source });
    const validation = validateNormalizedDataset(this.dataset);
    if (!validation.valid) throw new Error(validation.errors.join('\n'));
  }

  async load() {
    return this.dataset;
  }

  async getExams() {
    return this.dataset.exams;
  }

  async getExam(id) {
    return this.dataset.exams.find((exam) => String(exam.id) === String(id)) ?? null;
  }
}
