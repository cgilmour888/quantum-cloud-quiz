import { normalizeQuizDataset } from './datasetNormalizer.js';

function push(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function validateNormalizedDataset(dataset) {
  const errors = [];

  push(errors, dataset && typeof dataset === 'object', 'Dataset must be an object.');
  push(errors, Array.isArray(dataset?.exams), 'Dataset must contain an exams array.');
  push(errors, (dataset?.exams?.length ?? 0) > 0, 'Dataset must contain at least one exam.');

  const examIds = new Set();
  const questionIds = new Set();

  for (const [examIndex, exam] of (dataset?.exams ?? []).entries()) {
    const examPrefix = `exams[${examIndex}]`;

    push(errors, typeof exam.id === 'string' && exam.id.length > 0, `${examPrefix}.id is required.`);
    push(errors, !examIds.has(exam.id), `${examPrefix}.id must be unique.`);
    examIds.add(exam.id);

    push(errors, typeof exam.title === 'string' && exam.title.length > 0, `${examPrefix}.title is required.`);
    push(errors, Array.isArray(exam.questions), `${examPrefix}.questions must be an array.`);
    push(errors, (exam.questions?.length ?? 0) > 0, `${examPrefix}.questions must not be empty.`);

    for (const [questionIndex, question] of (exam.questions ?? []).entries()) {
      const prefix = `${examPrefix}.questions[${questionIndex}]`;
      const optionKeys = new Set((question.options ?? []).map((option) => option.key));

      push(errors, typeof question.id === 'string' && question.id.length > 0, `${prefix}.id is required.`);
      push(errors, !questionIds.has(question.id), `${prefix}.id must be unique across the collection.`);
      questionIds.add(question.id);

      push(errors, typeof question.prompt === 'string' && question.prompt.length > 0, `${prefix}.prompt is required.`);
      push(errors, Array.isArray(question.options) && question.options.length >= 2, `${prefix}.options must contain at least two options.`);
      push(errors, optionKeys.size === (question.options?.length ?? 0), `${prefix}.option keys must be unique.`);
      push(errors, Array.isArray(question.answers) && question.answers.length >= 1, `${prefix}.answers must contain at least one key.`);

      for (const answer of question.answers ?? []) {
        push(errors, optionKeys.has(answer), `${prefix}.answer ${answer} does not match an option key.`);
      }

      push(
        errors,
        question.selectionType === 'single' || question.selectionType === 'multiple',
        `${prefix}.selectionType must be single or multiple.`,
      );
      push(
        errors,
        Number(question.selectionCount) === (question.answers?.length ?? 0),
        `${prefix}.selectionCount must equal the number of correct answers.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Backward-compatible entry point. It accepts the former single-exam schema,
 * the legacy multi-exam collection, arrays of exams, or one exam object.
 */
export function validateQuizDataset(value) {
  let dataset;

  try {
    dataset = normalizeQuizDataset(value);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      dataset: null,
    };
  }

  const validation = validateNormalizedDataset(dataset);

  return {
    ...validation,
    dataset,
  };
}
