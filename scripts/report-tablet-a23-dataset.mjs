import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const source = JSON.parse(await readFile(new URL('../public/data/aws-cloud-practitioner.exams.json', import.meta.url), 'utf8'));
const exams = Array.isArray(source.exams) ? source.exams : [source];
let questions = 0;
let options = 0;
let fiveOptionQuestions = 0;
const outliers = [];
for (const exam of exams) {
  for (const question of exam.questions ?? []) {
    questions += 1;
    options += (question.options ?? []).length;
    if ((question.options ?? []).length > 4) fiveOptionQuestions += 1;
    const longest = Math.max(0, ...(question.options ?? []).map((option) => String(option.text ?? '').length));
    if (String(question.prompt ?? '').length > 335 || longest > 175) {
      outliers.push({ exam: exam.id ?? exam.title, question: question.id, promptLength: String(question.prompt ?? '').length, longestOption: longest });
    }
  }
}
const report = { exams: exams.length, questions, options, fiveOptionQuestions, typographyOutliers: outliers };
const jsonUrl = new URL('../reports/A2.3-DATASET-PREFLIGHT.json', import.meta.url);
await mkdir(dirname(jsonUrl.pathname), { recursive: true });
await writeFile(jsonUrl, JSON.stringify(report, null, 2));
await writeFile(new URL('../reports/A2.3-DATASET-PREFLIGHT.md', import.meta.url), `# A2.3 Dataset Preflight\n\n- Exams: ${exams.length}\n- Questions: ${questions}\n- Options: ${options}\n- Five-option questions: ${fiveOptionQuestions}\n- Typography outliers requiring later review: ${outliers.length}\n`);
console.log(`A2.3 dataset preflight: ${exams.length} exams, ${questions} questions, ${options} options.`);
