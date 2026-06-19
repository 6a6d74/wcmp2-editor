import type { FormState } from '../hooks/useWcmp2Form';

export interface ParseResult {
  form: FormState | null;
  errors: string[];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

// Normalise ISO timestamps or date-only strings to YYYY-MM-DDTHH:MM:SS
// for datetime-local inputs (no trailing Z or offset).
function toDatetimeLocal(v: unknown): string {
  const s = str(v);
  if (!s) return '';
  // Strip timezone suffix (Z or ±HH:MM)
  const bare = s.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').slice(0, 19);
  // If only a date was supplied, add midnight time
  return bare.length === 10 ? `${bare}T00:00:00` : bare;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function validateAndParse(raw: unknown): ParseResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { form: null, errors: ['Not a valid JSON object.'] };
  }

  const rec = raw as Record<string, unknown>;

  if (rec['type'] !== 'Feature') {
    errors.push('Top-level "type" must be "Feature".');
  }

  const conformsTo = arr<string>(rec['conformsTo']);
  if (!conformsTo.some(c => typeof c === 'string' && c.includes('wcmp/2'))) {
    errors.push(
      '"conformsTo" must include the WCMP2 conformance URI (http://wis.wmo.int/spec/wcmp/2/conf/core).',
    );
  }

  const props = (
    rec['properties'] && typeof rec['properties'] === 'object' && !Array.isArray(rec['properties'])
      ? rec['properties']
      : {}
  ) as Record<string, unknown>;

  if (!props['title'] || typeof props['title'] !== 'string' || !props['title'].trim()) {
    errors.push('properties.title is required and must be a non-empty string.');
  }
  if (!props['description'] || typeof props['description'] !== 'string' || !props['description'].trim()) {
    errors.push('properties.description is required and must be a non-empty string.');
  }

  const themes = arr(props['themes']);
  if (themes.length === 0) {
    errors.push('properties.themes must contain at least one theme.');
  }

  const contacts = arr(props['contacts']);
  if (contacts.length === 0) {
    errors.push('properties.contacts must contain at least one contact.');
  }

  const policy = props['wmo:dataPolicy'];
  if (props['type'] === 'dataset' && policy !== 'core' && policy !== 'recommended') {
    errors.push('properties["wmo:dataPolicy"] must be "core" or "recommended".');
  }

  const links = arr(rec['links']);
  if (links.length === 0) {
    errors.push('"links" must contain at least one link.');
  }

  // ── Parse ID into centreId + localId ──────────────────────────────────────
  const id = str(rec['id']);
  let centreId = '';
  let localId = '';
  const urnPrefix = 'urn:wmo:md:';
  if (id.startsWith(urnPrefix)) {
    const rest = id.slice(urnPrefix.length);
    const colonIdx = rest.indexOf(':');
    if (colonIdx !== -1) {
      centreId = rest.slice(0, colonIdx);
      localId = rest.slice(colonIdx + 1);
    } else {
      centreId = rest;
    }
  }

  // ── Temporal ──────────────────────────────────────────────────────────────
  const time = rec['time'] as Record<string, unknown> | null | undefined;
  let timeType: FormState['timeType'] = 'none';
  let timeDate = '';
  let timeTimestamp = '';
  let timeBegin = '';
  let timeEnd = '';

  let temporalResolution = '';

  if (time && typeof time === 'object') {
    if (typeof time['date'] === 'string') {
      timeType = 'date';
      timeDate = time['date'];
    } else if (typeof time['timestamp'] === 'string') {
      timeType = 'timestamp';
      timeTimestamp = time['timestamp'];
    } else if (Array.isArray(time['interval'])) {
      timeType = 'interval';
      const iv = time['interval'] as string[];
      timeBegin = iv[0] === '..' ? '..' : str(iv[0]);
      timeEnd = iv[1] === '..' ? '..' : str(iv[1]);
    }
    // resolution lives directly on the time object
    temporalResolution = str(time['resolution']);
  }

  const additionalExtentsRaw = rec['additionalExtents'] as Record<string, unknown> | null | undefined;
  const hasTemporal = !!additionalExtentsRaw?.['temporal'];
  const hasSpatial  = !!additionalExtentsRaw?.['spatial'];
  const additionalExtentsJson = hasTemporal
    ? JSON.stringify({ temporal: additionalExtentsRaw!['temporal'] }, null, 2)
    : '';
  const additionalSpatialExtentsJson = hasSpatial
    ? JSON.stringify({ spatial: additionalExtentsRaw!['spatial'] }, null, 2)
    : '';

  const form: FormState = {
    id,
    centreId,
    localId,
    resourceType: str(props['type']) || 'dataset',
    title: str(props['title']),
    description: str(props['description']),
    themes: arr(props['themes']),
    geometry: (rec['geometry'] as GeoJSON.Geometry | null) ?? null,
    timeType,
    timeDate,
    timeTimestamp,
    timeBegin,
    timeEnd,
    temporalResolution,
    contacts: arr(props['contacts']),
    dataPolicy: (policy === 'core' || policy === 'recommended') ? policy : 'core',
    links: arr(rec['links']),
    keywords: arr<string>(props['keywords']),
    version: str(props['version']),
    externalIds: arr(props['externalIds']),
    rights: str(props['rights']),
    status: (props['status'] as FormState['status']) ?? {},
    created: toDatetimeLocal(props['created']) || new Date().toISOString().slice(0, 19),
    updated: toDatetimeLocal(props['updated']),
    includeAdditionalExtents: hasTemporal,
    additionalExtentsJson,
    includeAdditionalSpatialExtents: hasSpatial,
    additionalSpatialExtentsJson,
  };

  return { form, errors };
}
