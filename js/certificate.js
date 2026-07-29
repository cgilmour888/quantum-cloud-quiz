import { MASTERY_THRESHOLD, getRank } from './constants.js';

function escapeXML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function certificateId(result) {
  const compactDate = new Date(result.completedAt).toISOString().slice(0, 10).replaceAll('-', '');
  return `QCQ-${compactDate}-${String(result.id || '').slice(0, 8).toUpperCase()}`;
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('') : 'AWS';
}

function avatarMarkup(profile) {
  if (profile.avatarMode === 'image' && /^data:image\//.test(profile.avatarImage || '')) {
    return `<defs><clipPath id="avatarClip"><circle cx="800" cy="205" r="58"/></clipPath></defs>
      <circle cx="800" cy="205" r="66" fill="#071026" stroke="url(#neon)" stroke-width="3" filter="url(#softGlow)"/>
      <image href="${escapeXML(profile.avatarImage)}" x="742" y="147" width="116" height="116" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`;
  }
  const symbol = profile.avatarSymbol || initials(profile.name);
  return `<circle cx="800" cy="205" r="66" fill="#071026" stroke="url(#neon)" stroke-width="3" filter="url(#softGlow)"/>
    <text x="800" y="226" text-anchor="middle" fill="#eafcff" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700">${escapeXML(symbol)}</text>`;
}

export function buildCertificateSVG({ profile, result }) {
  const name = profile.name?.trim() || 'AWS Cloud Scholar';
  const score = Number(result.score).toFixed(2);
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(result.completedAt));
  const rank = getRank(Number(result.score)).label;
  const title = result.title || 'AWS Practice Examination';
  const id = certificateId(result);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title desc">
  <title id="title">Certificate of AWS Practice Exam Mastery</title>
  <desc id="desc">Awarded to ${escapeXML(name)} for earning ${score}% on ${escapeXML(title)}.</desc>
  <defs>
    <radialGradient id="void" cx="50%" cy="30%" r="82%">
      <stop offset="0" stop-color="#17114b"/>
      <stop offset="0.44" stop-color="#070c24"/>
      <stop offset="1" stop-color="#02040a"/>
    </radialGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4df5ff"/>
      <stop offset="0.34" stop-color="#8c62ff"/>
      <stop offset="0.68" stop-color="#36f7b2"/>
      <stop offset="1" stop-color="#edf9ff"/>
    </linearGradient>
    <linearGradient id="iridium" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9d78ff"/>
      <stop offset="0.25" stop-color="#eafcff"/>
      <stop offset="0.5" stop-color="#7df8ff"/>
      <stop offset="0.75" stop-color="#d9c9ff"/>
      <stop offset="1" stop-color="#58eeb9"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="avatarClip"><circle cx="800" cy="205" r="58"/></clipPath>
  </defs>
  <rect width="1600" height="1000" fill="url(#void)"/>
  <rect x="52" y="52" width="1496" height="896" rx="38" fill="none" stroke="url(#neon)" stroke-width="4" filter="url(#softGlow)"/>
  <rect x="78" y="78" width="1444" height="844" rx="28" fill="none" stroke="#8c62ff" stroke-opacity="0.42" stroke-width="1.5"/>
  <g opacity="0.78" filter="url(#glow)">
    <ellipse cx="800" cy="145" rx="245" ry="52" fill="#111b42"/>
    <ellipse cx="690" cy="132" rx="115" ry="62" fill="#1a2355"/>
    <ellipse cx="810" cy="111" rx="145" ry="78" fill="#171d50"/>
    <ellipse cx="930" cy="137" rx="120" ry="60" fill="#151a45"/>
    <path d="M660 151 C720 103,760 197,820 140 S940 160,980 119" fill="none" stroke="#8c62ff" stroke-width="7" stroke-linecap="round"/>
    <path d="M750 153 L790 187 L771 188 L816 241" fill="none" stroke="url(#iridium)" stroke-width="5" stroke-linecap="round"/>
  </g>
  ${avatarMarkup(profile)}
  <text x="800" y="320" text-anchor="middle" fill="#dffcff" font-family="Orbitron, Arial, Helvetica, sans-serif" font-size="30" font-weight="900" letter-spacing="9">QUANTUM CLOUD QUIZ</text>
  <text x="800" y="398" text-anchor="middle" fill="url(#iridium)" font-family="Georgia, serif" font-size="68" font-weight="700" filter="url(#softGlow)">Certificate of Mastery</text>
  <text x="800" y="476" text-anchor="middle" fill="#9caac7" font-family="Arial, Helvetica, sans-serif" font-size="25">This certifies that</text>
  <text x="800" y="558" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="60" font-weight="700">${escapeXML(name)}</text>
  <line x1="360" y1="583" x2="1240" y2="583" stroke="url(#neon)" stroke-width="2" opacity="0.8"/>
  <text x="800" y="648" text-anchor="middle" fill="#cbd7ea" font-family="Arial, Helvetica, sans-serif" font-size="24">demonstrated ${escapeXML(rank)} mastery in</text>
  <text x="800" y="700" text-anchor="middle" fill="#72f7ff" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700">${escapeXML(title)}</text>
  <g transform="translate(370 765)">
    <text x="0" y="0" fill="#8fa1c0" font-family="Arial, Helvetica, sans-serif" font-size="20">SCORE</text>
    <text x="0" y="48" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">${score}%</text>
  </g>
  <g transform="translate(700 765)">
    <text x="0" y="0" fill="#8fa1c0" font-family="Arial, Helvetica, sans-serif" font-size="20">DATE</text>
    <text x="0" y="48" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">${escapeXML(date)}</text>
  </g>
  <g transform="translate(1130 765)">
    <text x="0" y="0" fill="#8fa1c0" font-family="Arial, Helvetica, sans-serif" font-size="20">RANK</text>
    <text x="0" y="48" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${escapeXML(rank)}</text>
  </g>
  <text x="800" y="900" text-anchor="middle" fill="#71809c" font-family="monospace" font-size="17">Certificate ID: ${escapeXML(id)} · Mastery threshold: ${MASTERY_THRESHOLD}%</text>
</svg>`;
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCertificateSVG(profile, result) {
  const svg = buildCertificateSVG({ profile, result });
  triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `certificate-${result.id}.svg`);
}

export async function downloadCertificatePNG(profile, result) {
  const svg = buildCertificateSVG({ profile, result });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const image = new Image();
  const url = URL.createObjectURL(blob);
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!pngBlob) throw new Error('Unable to create the PNG certificate.');
  triggerDownload(pngBlob, `certificate-${result.id}.png`);
}

export function downloadProgressBackup({ profile, results, missed, customBanks, settings }) {
  const payload = {
    format: 'quantum-cloud-quiz-backup-v1',
    exportedAt: new Date().toISOString(),
    profile,
    results,
    missed,
    customBanks,
    settings,
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    `quantum-cloud-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
}
