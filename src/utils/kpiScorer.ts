import type { FormState } from '../hooks/useWcmp2Form';

export interface KpiResult {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  hints: string[];
}

export interface KpiSummary {
  results: KpiResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

const BULLETIN_HEADER = /^[A-Z]{4}\d{2}[A-Z]{4}/;
const HTML_TAG = /<[^>]+>/;
const ACRONYM = /\b[A-Z]{2,}\b/g;

function gradeFromPct(pct: number): KpiSummary['grade'] {
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 35) return 'D';
  if (pct >= 20) return 'E';
  return 'F';
}

function scoreTitle(title: string): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 8;

  if (title) {
    score++;
    const words = title.trim().split(/\s+/);
    if (words.length >= 3) score++;
    else hints.push('Title should contain at least 3 words');

    if (title.length <= 150) score++;
    else hints.push('Title should be 150 characters or fewer');

    if (/^[a-zA-Z0-9\s.,:()\-/']+$/.test(title)) score++;
    else hints.push('Title should contain only alphanumeric characters and common punctuation');

    const firstWord = words[0];
    const isUpperFirst = firstWord[0] === firstWord[0].toUpperCase();
    const restLower = words.slice(1).every(w => /^[A-Z]{2,}$/.test(w) || w[0] === w[0].toLowerCase());
    if (isUpperFirst && restLower) score++;
    else hints.push('Title should use sentence case (only first word and acronyms capitalised)');

    const acronyms = title.match(ACRONYM) || [];
    if (acronyms.length <= 3) score++;
    else hints.push('Title should contain 3 or fewer acronyms');

    if (!BULLETIN_HEADER.test(title)) score++;
    else hints.push('Title should not start with a bulletin header (e.g. TTAA00CCCC)');

    score++; // spelling — can't check in-browser without a dict; assume pass
  } else {
    hints.push('Title is required');
  }

  return { id: 'title', name: 'Good quality title', score, maxScore: max, hints };
}

function scoreDescription(description: string): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 4;

  if (description) {
    if (description.length >= 16 && description.length <= 2048) score++;
    else hints.push('Description should be between 16 and 2048 characters');

    if (!HTML_TAG.test(description)) score++;
    else hints.push('Description should not contain HTML markup');

    if (!BULLETIN_HEADER.test(description)) score++;
    else hints.push('Description should not start with a bulletin header');

    score++; // spelling check — assume pass
  } else {
    hints.push('Description is required');
  }

  return { id: 'description', name: 'Good quality description', score, maxScore: max, hints };
}

function scoreTimeIntervals(form: FormState): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 3;

  if (form.timeType === 'interval') {
    const begin = form.timeBegin;
    const end = form.timeEnd;

    if (begin && end && begin !== '..' && end !== '..') {
      if (new Date(begin) <= new Date(end)) score++;
      else hints.push('Begin date must be before or equal to end date');
    } else if (begin || end) {
      score++; // open-ended is valid
    }

    if (!((!begin || begin === '..') && (!end || end === '..'))) score++;
    else hints.push('Temporal extent should not be fully open (both begin and end as open)');

    if (form.temporalResolution) score++;
    else hints.push('Specify a temporal resolution (e.g. PT1H for hourly data)');
  } else if (form.timeType === 'date' && form.timeDate) {
    score += 2; // single date is valid; resolution N/A
    hints.push('Consider using an interval for datasets with temporal extent');
  } else if (form.timeType === 'timestamp' && form.timeTimestamp) {
    score += 2;
  } else {
    hints.push('Add a temporal extent to improve discoverability');
  }

  return { id: 'time', name: 'Good quality time intervals', score, maxScore: max, hints };
}

function scoreGraphicOverview(form: FormState): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 3;

  const previewLinks = form.links.filter(l => l.rel === 'preview');
  if (previewLinks.length === 0) {
    hints.push('Add a "preview" link with a thumbnail image to improve KPI score');
    return { id: 'graphic', name: 'Graphic overview', score, maxScore: max, hints };
  }

  score++; // preview link exists

  const validImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const firstPreview = previewLinks[0];
  if (firstPreview.type && validImageTypes.includes(firstPreview.type)) score++;
  else hints.push('Preview link should have a valid image MIME type (image/png, image/jpeg, etc.)');

  if (firstPreview.href && /^https?:\/\//.test(firstPreview.href)) score++;
  else hints.push('Preview URL should be a valid HTTP(S) URL');

  return { id: 'graphic', name: 'Graphic overview', score, maxScore: max, hints };
}

function scoreLinksHealth(form: FormState): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const httpLinks = form.links.filter(l => /^https?:\/\//.test(l.href));
  const max = Math.max(2, httpLinks.length * 2);

  if (httpLinks.length === 0) {
    hints.push('Add at least one HTTP(S) link');
    return { id: 'links', name: 'Links health', score, maxScore: 2, hints };
  }

  for (const link of httpLinks) {
    score++; // assume URL resolves (can't verify without making requests)
    if (link.type) score++;
    else hints.push(`Link "${link.href}" should have a MIME type specified`);
  }

  return { id: 'links', name: 'Links health', score, maxScore: max, hints };
}

function scoreContacts(form: FormState): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 4;

  if (form.contacts.length === 0) {
    hints.push('At least one contact is required');
    return { id: 'contacts', name: 'Contacts', score, maxScore: max, hints };
  }

  const hasValidCountry = form.contacts.some(c =>
    c.addresses?.some(a => a.country && /^[A-Z]{3}$/.test(a.country))
  );
  if (hasValidCountry) score++;
  else hints.push('Provide a valid ISO 3166-1 alpha-3 country code in at least one contact address');

  const hasHost = form.contacts.some(c => c.roles?.includes('host'));
  if (hasHost) score++;
  else hints.push('Add a contact with the "host" role');

  const hostContact = form.contacts.find(c => c.roles?.includes('host'));
  if (hostContact?.contactInstructions) score++;
  else hints.push('The host contact should include contact instructions');

  if (hostContact?.emails?.some(e => e.value)) score++;
  else hints.push('The host contact should include an email address');

  return { id: 'contacts', name: 'Contacts', score, maxScore: max, hints };
}

function scorePids(form: FormState): KpiResult {
  const hints: string[] = [];
  let score = 0;
  const max = 3;

  if (form.externalIds.length > 0) {
    score++;
    const hasDoi = form.externalIds.some(e =>
      ['doi', 'ark', 'hdl'].includes(e.scheme.toLowerCase())
    );
    if (hasDoi) score++;
    else hints.push('Include a DOI, ARK, or HDL persistent identifier');
  } else {
    hints.push('Add external identifiers (e.g. DOI) to improve citability');
  }

  const hasCiteAs = form.links.some(l => l.rel === 'cite-as');
  if (hasCiteAs) score++;
  else hints.push('Add a "cite-as" link relation for the preferred citation URL');

  return { id: 'pids', name: 'Persistent identifiers', score, maxScore: max, hints };
}

export function scoreRecord(form: FormState): KpiSummary {
  const results: KpiResult[] = [
    scoreTitle(form.title),
    scoreDescription(form.description),
    scoreTimeIntervals(form),
    scoreGraphicOverview(form),
    scoreLinksHealth(form),
    scoreContacts(form),
    scorePids(form),
  ];

  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const maxScore = results.reduce((s, r) => s + r.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  return { results, totalScore, maxScore, percentage, grade: gradeFromPct(percentage) };
}
