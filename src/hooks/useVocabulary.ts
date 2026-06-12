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

// Relation names always start with a letter and are never quoted.
// Multi-line description fields appear on continuation lines (start with space/quote) — skip them.
function parseIanaLinkRelationsCsv(text: string): VocabItem[] {
  return text
    .split('\n')
    .filter(line => /^[a-z]/i.test(line))
    .map(line => {
      const name = line.split(',')[0].trim();
      return name ? { id: name, title: name } : null;
    })
    .filter((item): item is VocabItem => item !== null && item.id.length > 0);
}

function parseWcmp2LinkTypesCsv(text: string): VocabItem[] {
  return text
    .split('\n')
    .slice(1)
    .map(line => {
      const cols = line.split(',');
      const name = cols[0]?.trim();
      const desc = cols[1]?.trim();
      return name ? { id: name, title: desc || name } : null;
    })
    .filter((item): item is VocabItem => item !== null && item.id.length > 0);
}

function mergeRelations(iana: VocabItem[], wcmp2: VocabItem[]): VocabItem[] {
  const ianaIds = new Set(iana.map(r => r.id));
  return [...iana, ...wcmp2.filter(r => !ianaIds.has(r.id))];
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
      fetch('https://www.iana.org/assignments/link-relations/link-relations-1.csv')
        .then(r => r.text())
        .catch(() => null),
      fetch('https://raw.githubusercontent.com/wmo-im/wcmp2-codelists/main/codelists/link-type.csv')
        .then(r => r.text())
        .catch(() => null),
    ]).then(([disciplineData, resourceData, contactRoleCsv, ianaLinksCsv, wcmp2LinksCsv]) => {
      if (cancelled) return;
      const parsedRoles = contactRoleCsv ? parseContactRolesCsv(contactRoleCsv) : null;
      const ianaRelations = ianaLinksCsv ? parseIanaLinkRelationsCsv(ianaLinksCsv) : null;
      const wcmp2Relations = wcmp2LinksCsv ? parseWcmp2LinkTypesCsv(wcmp2LinksCsv) : null;
      const merged = ianaRelations && wcmp2Relations
        ? mergeRelations(ianaRelations, wcmp2Relations)
        : ianaRelations ?? wcmp2Relations ?? null;
      setState(s => ({
        ...s,
        loading: false,
        disciplines: disciplineData
          ? parseWmoRegistry(disciplineData, EARTH_SYSTEM_DISCIPLINES)
          : s.disciplines,
        resourceTypes: resourceData
          ? parseWmoRegistry(resourceData, RESOURCE_TYPES)
          : s.resourceTypes,
        contactRoles: parsedRoles && parsedRoles.length > 0 ? parsedRoles : s.contactRoles,
        linkRelations: merged && merged.length > 0 ? merged : s.linkRelations,
      }));
    });

    return () => { cancelled = true; };
  }, []);

  return state;
}
