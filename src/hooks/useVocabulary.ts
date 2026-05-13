import { useState, useEffect } from 'react';
import { EARTH_SYSTEM_DISCIPLINES, CONTACT_ROLES, RESOURCE_TYPES } from '../utils/vocabularies';

interface VocabItem { id: string; title: string; description?: string }

interface VocabState {
  disciplines: VocabItem[];
  contactRoles: string[];
  resourceTypes: VocabItem[];
  loading: boolean;
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
    ]).then(([disciplineData, resourceData]) => {
      if (cancelled) return;
      setState(s => ({
        ...s,
        loading: false,
        disciplines: disciplineData
          ? parseWmoRegistry(disciplineData, EARTH_SYSTEM_DISCIPLINES)
          : s.disciplines,
        resourceTypes: resourceData
          ? parseWmoRegistry(resourceData, RESOURCE_TYPES)
          : s.resourceTypes,
      }));
    });

    return () => { cancelled = true; };
  }, []);

  return state;
}
