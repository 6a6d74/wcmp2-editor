import type { Wcmp2Record, TimeExtent } from '../types/wcmp2';
import type { FormState } from '../hooks/useWcmp2Form';

// Convert a datetime-local string (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
// to a full ISO 8601 UTC timestamp (YYYY-MM-DDThh:mm:ssZ).
function toIsoZ(s: string): string {
  if (!s) return new Date().toISOString().slice(0, 19) + 'Z';
  const withSecs = s.length === 16 ? `${s}:00` : s.slice(0, 19);
  return `${withSecs}Z`;
}

export function buildRecord(form: FormState): Wcmp2Record {
  const properties: Wcmp2Record['properties'] = {
    type: form.resourceType,
    title: form.title,
    description: form.description,
    themes: form.themes,
    contacts: form.contacts,
    created: toIsoZ(form.created),
    'wmo:dataPolicy': form.dataPolicy,
  };

  if (form.updated) properties.updated = toIsoZ(form.updated);
  if (form.keywords.length > 0) properties.keywords = form.keywords;
  if (form.version) properties.version = form.version;
  if (form.externalIds.length > 0) properties.externalIds = form.externalIds;
  if (form.rights) properties.rights = form.rights;
  if (form.status?.id) properties.status = form.status;

  let time: TimeExtent = null;
  if (form.timeType === 'date' && form.timeDate) {
    time = { date: form.timeDate };
  } else if (form.timeType === 'timestamp' && form.timeTimestamp) {
    time = { timestamp: form.timeTimestamp };
  } else if (form.timeType === 'interval' && (form.timeBegin || form.timeEnd)) {
    time = { interval: [form.timeBegin || '..', form.timeEnd || '..'] };
  }

  const record: Wcmp2Record = {
    id: form.id,
    type: 'Feature',
    conformsTo: ['http://wis.wmo.int/spec/wcmp/2/conf/core'],
    geometry: form.geometry,
    time,
    properties,
    links: form.links,
  };

  if (form.temporalResolution && form.timeType === 'interval' && (form.timeBegin || form.timeEnd)) {
    record.additionalExtents = {
      temporal: {
        interval: [[form.timeBegin || '..', form.timeEnd || '..']],
        resolution: form.temporalResolution,
      },
    };
  }

  return record;
}

export function downloadRecord(record: Wcmp2Record, filename?: string) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${record.id.replace(/[^a-z0-9-]/gi, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
