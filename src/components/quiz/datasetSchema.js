export function validateQuizDataset(value) {
  const errors = [];
  const exam = value?.exam;

  if (!exam || typeof exam !== 'object') errors.push('Missing exam object.');
  if (!exam?.id || typeof exam.id !== 'string') errors.push('exam.id must be a string.');
  if (!exam?.title || typeof exam.title !== 'string') errors.push('exam.title must be a string.');
  if (!Array.isArray(exam?.questions) || exam.questions.length === 0) {
    errors.push('exam.questions must contain at least one question.');
  }

  for (const [index, question] of (exam?.questions ?? []).entries()) {
    const prefix = `exam.questions[${index}]`;
    if (!question.id) errors.push(`${prefix}.id is required.`);
    if (!question.question) errors.push(`${prefix}.question is required.`);
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${prefix}.options must contain at least two options.`);
    }
    const optionIds = new Set((question.options ?? []).map((option) => option.id));
    if (!optionIds.has(question.correctAnswer)) {
      errors.push(`${prefix}.correctAnswer must match an option id.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
