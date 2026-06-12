import { useState, useEffect } from 'react';
import { EARTH_SYSTEM_DISCIPLINES, CONTACT_ROLES, RESOURCE_TYPES, LINK_RELATIONS } from '../utils/vocabularies';

interface VocabItem { id: string; title: string; description?: string }

interface VocabState {
  disciplines: VocabItem[];
  contactRoles: string[];
  resourceTypes: VocabItem[];
  linkRelations: VocabItem[];
  loading: boolean;
}

// WCMP2 link-type CSV: append any entries not already in the static IANA fallback.
function parseWcmp2LinkTypesCsv(text: string, existing: VocabItem[]): VocabItem[] {
  const existingIds = new Set(existing.map(r => r.id));
  return text
    .split('\n')
    .slice(1)
    .map(line => {
      const cols = line.split(',');
      const name = cols[0]?.trim();
      const desc = cols[1]?.trim();
      return name ? { id: name, title: desc || name } : null;
    })
    .filter((item): item is VocabItem => item !== null && item.id.length > 0 && !existingIds.has(item.id));
}

function parseContactRolesCsv(text: string): string[] {
  const roles = text
    .split('\n')
    .slice(1) // skip header row
    .map(line => line.split(',')[0].trim())
    .filter(name => name.length > 0);
  return roles.length > 0 ? roles : [];
}

function parseWmoRegistry(data: unknown, fallback: VocabItem[]): VocabItem[] {
  try {
    // WMO registry JSON-LD format
    const graph = (data as Record<string, unknown>)['@graph'] as unknown[];
    if (Array.isArray(graph)) {
      return graph
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .filter(item => item['@type'] !== 'skos:ConceptScheme')
        .map(item => ({
          id: String(item['@id'] || '').split('/').pop() || '',
          title: String(
            (item as Record<string, Record<string, string>>)['skos:prefLabel']?.['@value'] ||
            item['skos:prefLabel'] || ''
          ),
          description: String(
            (item as Record<string, Record<string, string>>)['skos:definition']?.['@value'] || ''
          ),
        }))
        .filter(item => item.id && item.title);
    }
  } catch {
    // fall through to fallback
  }
  return fallback;
}

export function useVocabulary(): VocabState {
  const [state, setState] = useState<VocabState>({
    disciplines: EARTH_SYSTEM_DISCIPLINES,
    contactRoles: CONTACT_ROLES,
    resourceTypes: RESOURCE_TYPES,
    linkRelations: LINK_RELATIONS,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));

    Promise.all([
      fetch('https://codes.wmo.int/wis/topic-hierarchy/earth-system-discipline.json')
        .then(r => r.json())
        .catch(() => null),
      fetch('https://codes.wmo.int/wis/resource-type.json')
        .then(r => r.json())
        .catch(() => null),
      fetch('https://raw.githubusercontent.com/wmo-im/wcmp2-codelists/main/codelists/contact-role.csv')
        .then(r => r.text())
        .catch(() => null),
      fetch('https://raw.githubusercontent.com/wmo-im/wcmp2-codelists/main/codelists/link-type.csv')
        .then(r => r.text())
        .catch(() => null),
    ]).then(([disciplineData, resourceData, contactRoleCsv, wcmp2LinksCsv]) => {
      if (cancelled) return;
      const parsedRoles = contactRoleCsv ? parseContactRolesCsv(contactRoleCsv) : null;
      setState(s => {
        const wcmp2Additions = wcmp2LinksCsv ? parseWcmp2LinkTypesCsv(wcmp2LinksCsv, s.linkRelations) : [];
        return {
          ...s,
          loading: false,
          disciplines: disciplineData
            ? parseWmoRegistry(disciplineData, EARTH_SYSTEM_DISCIPLINES)
            : s.disciplines,
          resourceTypes: resourceData
            ? parseWmoRegistry(resourceData, RESOURCE_TYPES)
            : s.resourceTypes,
          contactRoles: parsedRoles && parsedRoles.length > 0 ? parsedRoles : s.contactRoles,
          linkRelations: wcmp2Additions.length > 0
            ? [...s.linkRelations, ...wcmp2Additions]
            : s.linkRelations,
        };
      });
    });

    return () => { cancelled = true; };
  }, []);

  return state;
}
