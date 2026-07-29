import { loadCustomBanks, saveCustomBanks } from './storage.js';

function cleanMarkup(value = '') {
  const temp = document.createElement('div');
  temp.innerHTML = value.replaceAll('<br/>', ' ').replaceAll('<br />', ' ').replaceAll('<br>', ' ');
  return (temp.textContent || temp.innerText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAnswers(raw = '') {
  return [...new Set((raw.toUpperCase().match(/[A-E]/g) || []))];
}

function inferTopic(prompt, options) {
  const text = `${prompt} ${options.map((option) => option.text).join(' ')}`.toLowerCase();
  const rules = [
    ['Security & Compliance', ['iam', 'security', 'compliance', 'encryption', 'mfa', 'waf', 'shield', 'guardduty', 'inspector', 'shared responsibility']],
    ['Billing, Pricing & Support', ['billing', 'cost', 'pricing', 'budget', 'reserved instance', 'support plan', 'trusted advisor', 'tco']],
    ['Networking & Content Delivery', ['vpc', 'subnet', 'cloudfront', 'route 53', 'direct connect', 'vpn', 'network', 'load balancer', 'latency']],
    ['Storage', ['s3', 'ebs', 'efs', 'glacier', 'storage', 'snowball', 'snapshot']],
    ['Databases', ['rds', 'dynamodb', 'aurora', 'redshift', 'database', 'elasticache', 'nosql', 'sql']],
    ['Compute & Containers', ['ec2', 'lambda', 'fargate', 'container', 'compute', 'auto scaling', 'elastic beanstalk']],
    ['Monitoring & Management', ['cloudwatch', 'cloudtrail', 'config', 'systems manager', 'organizations', 'cloudformation', 'monitor']],
    ['Architecture, Reliability & Performance', ['availability zone', 'region', 'reliability', 'elasticity', 'fault tolerance', 'well-architected']],
    ['Migration & Transfer', ['migration', 'migrate', 'dms', 'transfer', 'snowmobile']],
    ['Application Integration & Developer Tools', ['sqs', 'sns', 'api gateway', 'codebuild', 'codepipeline', 'sdk', 'cli']],
    ['AI, Analytics & Emerging Services', ['rekognition', 'polly', 'sagemaker', 'kinesis', 'athena', 'analytics', 'iot']],
  ];
  const match = rules
    .map(([topic, words]) => [topic, words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0)])
    .sort((a, b) => b[1] - a[1])[0];
  return match?.[1] ? match[0] : 'Cloud Concepts';
}

export class StaticQuestionRepository {
  constructor(url = './data/exams.json') {
    this.url = url;
    this.payload = null;
  }

  async load() {
    if (this.payload) return this.payload;
    const response = await fetch(this.url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load question bank (${response.status}).`);
    this.payload = await response.json();
    return this.payload;
  }

  async getExams() {
    return (await this.load()).exams;
  }
}

export class CustomQuestionRepository {
  getExams() {
    return loadCustomBanks();
  }

  saveExam(exam) {
    const banks = loadCustomBanks();
    const nextId = exam.id || `custom-${crypto.randomUUID()}`;
    const normalized = { ...exam, id: nextId, custom: true };
    const updated = [...banks.filter((bank) => bank.id !== nextId), normalized];
    saveCustomBanks(updated);
    return normalized;
  }

  deleteExam(id) {
    saveCustomBanks(loadCustomBanks().filter((bank) => bank.id !== id));
  }
}

export class CompositeQuestionRepository {
  constructor(staticRepository = new StaticQuestionRepository(), customRepository = new CustomQuestionRepository()) {
    this.staticRepository = staticRepository;
    this.customRepository = customRepository;
  }

  async getExams() {
    const builtIn = await this.staticRepository.getExams();
    return [...builtIn, ...this.customRepository.getExams()];
  }

  async getAllQuestions() {
    const exams = await this.getExams();
    return exams.flatMap((exam) => exam.questions.map((question) => ({ ...question, examId: exam.id, examTitle: exam.title })));
  }

  saveCustomExam(exam) {
    return this.customRepository.saveExam(exam);
  }
}

// Future dynamic migration point. Swap this class into CompositeQuestionRepository
// when an authenticated API becomes available; the UI and quiz engine remain unchanged.
export class ApiQuestionRepository {
  constructor(baseUrl, tokenProvider = () => '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tokenProvider = tokenProvider;
  }

  async getExams() {
    const response = await fetch(`${this.baseUrl}/exams`, {
      headers: { Authorization: `Bearer ${await this.tokenProvider()}` },
    });
    if (!response.ok) throw new Error('Unable to load exams from the API.');
    return response.json();
  }
}

export function parseUploadedJSON(text, fileName = 'Uploaded Exam') {
  const parsed = JSON.parse(text);
  const candidates = Array.isArray(parsed) ? parsed : parsed.exams || [parsed];
  return candidates.map((exam, examIndex) => {
    const questions = (exam.questions || []).map((question, index) => {
      const options = (question.options || question.choices || []).map((option, optionIndex) =>
        typeof option === 'string'
          ? { key: String.fromCharCode(65 + optionIndex), text: option }
          : { key: option.key || String.fromCharCode(65 + optionIndex), text: option.text || option.label || '' },
      );
      const answers = Array.isArray(question.answers)
        ? question.answers
        : normalizeAnswers(question.answer || question.correct || '');
      return {
        id: question.id || `upload-${Date.now()}-${examIndex}-${index}`,
        number: index + 1,
        sourceNumber: question.sourceNumber || index + 1,
        prompt: question.prompt || question.question || '',
        options,
        answers,
        selectionType: answers.length > 1 ? 'multiple' : 'single',
        selectionCount: answers.length || 1,
        topic: question.topic || inferTopic(question.prompt || question.question || '', options),
        explanation: question.explanation || '',
        references: question.references || [],
      };
    });
    if (!questions.length) throw new Error('The uploaded JSON does not contain questions.');
    return {
      id: exam.id || `custom-${crypto.randomUUID()}`,
      title: exam.title || `${fileName.replace(/\.[^.]+$/, '')} ${examIndex + 1}`,
      questionCount: questions.length,
      sourceFile: fileName,
      custom: true,
      questions,
    };
  });
}

export function parseUploadedMarkdown(text, fileName = 'Uploaded Exam') {
  const questionRegex = /^[ \t]*(\d+)\.[ \t]+/gm;
  const matches = [...text.matchAll(questionRegex)];
  if (!matches.length) throw new Error('No numbered questions were found in the Markdown file.');

  const questions = matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? text.length;
    const block = text.slice(start, end);
    const lines = block.split(/\r?\n/);
    const heading = lines.shift().match(/^\s*(\d+)\.\s*(.*)$/);
    const promptParts = [heading?.[2] || ''];
    const options = [];
    let currentOption = null;
    let inDetails = false;

    for (const line of lines) {
      if (line.includes('<details')) inDetails = true;
      if (inDetails) continue;
      const optionMatch = line.match(/^\s*-\s*([A-E])\.\s*(.*)$/);
      if (optionMatch) {
        currentOption = { key: optionMatch[1], text: cleanMarkup(optionMatch[2]) };
        options.push(currentOption);
      } else if (line.trim() && currentOption) {
        currentOption.text += ` ${cleanMarkup(line)}`;
      } else if (line.trim() && !line.trim().startsWith('<')) {
        promptParts.push(line.trim());
      }
    }

    const answerMatch = block.match(/Correct\s+Answer\s*:\s*([^\n<]+)/i);
    const answers = normalizeAnswers(answerMatch?.[1] || '');
    if (!options.length || !answers.length) throw new Error(`Question ${index + 1} is missing options or a correct answer.`);
    const prompt = cleanMarkup(promptParts.join(' '));
    const explanation = cleanMarkup(block.match(/Explanation\s*:\s*([\s\S]*?)(?:Reference\s*:|<\/details>)/i)?.[1] || '');
    return {
      id: `upload-${Date.now()}-${index}`,
      number: index + 1,
      sourceNumber: Number(heading?.[1] || index + 1),
      prompt,
      options,
      answers,
      selectionType: answers.length > 1 ? 'multiple' : 'single',
      selectionCount: answers.length,
      topic: inferTopic(prompt, options),
      explanation,
      references: [...block.matchAll(/https?:\/\/[^\s<>]+/g)].map((entry) => entry[0].replace(/[).,]+$/, '')),
    };
  });

  return [{
    id: `custom-${crypto.randomUUID()}`,
    title: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    questionCount: questions.length,
    sourceFile: fileName,
    custom: true,
    questions,
  }];
}
