import { useState, useCallback } from 'react';
import type { Theme, Contact, WcmpLink, ExternalId, Status } from '../types/wcmp2';

export interface FormState {
  // Identity
  id: string;
  centreId: string;
  localId: string;

  // Core properties
  resourceType: string;
  title: string;
  description: string;

  // Themes
  themes: Theme[];

  // Geospatial
  geometry: GeoJSON.Geometry | null;

  // Temporal
  timeType: 'none' | 'date' | 'timestamp' | 'interval';
  timeDate: string;
  timeTimestamp: string;
  timeBegin: string;
  timeEnd: string;
  temporalResolution: string;

  // Contacts
  contacts: Contact[];

  // Data policy
  dataPolicy: 'core' | 'recommended';

  // Links
  links: WcmpLink[];

  // Optional
  keywords: string[];
  version: string;
  externalIds: ExternalId[];
  rights: string;
  status: Status;
  created: string;
  updated: string;
}

const defaultForm: FormState = {
  id: '',
  centreId: '',
  localId: '',
  resourceType: 'dataset',
  title: '',
  description: '',
  themes: [],
  geometry: null,
  timeType: 'none',
  timeDate: '',
  timeTimestamp: '',
  timeBegin: '',
  timeEnd: '',
  temporalResolution: '',
  contacts: [],
  dataPolicy: 'core',
  links: [],
  keywords: [],
  version: '',
  externalIds: [],
  rights: '',
  status: {},
  created: new Date().toISOString().split('T')[0],
  updated: '',
};

export function useWcmp2Form() {
  const [form, setForm] = useState<FormState>(defaultForm);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto-build the URN id from centreId + localId
      if (key === 'centreId' || key === 'localId') {
        const cid = key === 'centreId' ? (value as string) : prev.centreId;
        const lid = key === 'localId' ? (value as string) : prev.localId;
        if (cid || lid) {
          next.id = `urn:wmo:md:${cid}:${lid}`;
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setForm(defaultForm), []);

  const load = useCallback((next: FormState) => setForm(next), []);

  return { form, update, reset, load };
}
