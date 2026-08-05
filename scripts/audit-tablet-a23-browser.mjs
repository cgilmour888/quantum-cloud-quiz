import { writeFile } from 'node:fs/promises';
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('A2.3 FULL BROWSER AUDIT REQUIRES PLAYWRIGHT.');
  console.error('Run on the target Mac: npm install --save-dev playwright && npx playwright install chromium');
  process.exit(2);
}
const baseURL = process.env.QCQ_A23_URL ?? 'http://127.0.0.1:5173/';
const viewports = [[1280,720],[1366,768],[1440,778],[1440,900],[1920,1080]];
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [width,height] of viewports) {
  const page = await browser.newPage({ viewport: { width,height } });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const record = await page.evaluate(() => {
    const tablet = document.querySelector('.qcq-a23-tablet-root');
    const plane = document.querySelector('.qcq-a23-content-plane');
    const answers = [...document.querySelectorAll('.qcq-a23-answer-copy')].map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { text: node.textContent.trim(), width: rect.width, height: rect.height, opacity: Number(style.opacity), visibility: style.visibility, color: style.color, zIndex: Number(style.zIndex) };
    });
    return {
      tablet: tablet?.getBoundingClientRect().toJSON(),
      plane: plane?.getBoundingClientRect().toJSON(),
      answerCount: answers.length,
      answers,
      singlePlane: document.querySelectorAll('.qcq-a23-content-plane').length,
      readingOverlays: document.querySelectorAll('.qcq-reading-overlay, [data-reading-overlay]').length,
    };
  });
  const failures = [];
  if (record.singlePlane !== 1) failures.push(`content planes=${record.singlePlane}`);
  if (record.readingOverlays !== 0) failures.push(`reading overlays=${record.readingOverlays}`);
  if (record.answerCount < 4) failures.push(`visible answer nodes=${record.answerCount}`);
  for (const answer of record.answers) {
    if (!answer.text || answer.width <= 0 || answer.height <= 0 || answer.opacity < 0.95 || answer.visibility !== 'visible' || answer.zIndex < 14) failures.push(`answer paint failure: ${answer.text}`);
  }
  results.push({ viewport: { width,height }, ...record, failures });
  await page.close();
}
await browser.close();
await writeFile(new URL('../reports/A2.3-BROWSER-AUDIT.json', import.meta.url), JSON.stringify(results, null, 2));
await writeFile(new URL('../reports/A2.3-BROWSER-AUDIT.md', import.meta.url), `# A2.3 Browser Audit\n\n${results.map((r) => `- ${r.viewport.width}×${r.viewport.height}: ${r.failures.length ? `FAILED — ${r.failures.join('; ')}` : 'PASSED'}`).join('\n')}\n`);
if (results.some((record) => record.failures.length)) process.exit(1);
console.log('A2.3 REAL BROWSER AUDIT: PASSED');
