export interface Theme {
  concepts: { id: string; title?: string; url?: string }[];
  scheme: string;
}

export interface Contact {
  identifier?: string;
  organization?: string;
  name?: string;
  position?: string;
  logo?: { href: string; rel: string; type?: string };
  phones?: { value: string; roles?: string[] }[];
  emails?: { value: string; roles?: string[] }[];
  addresses?: {
    deliveryPoint?: string[];
    city?: string;
    administrativeArea?: string;
    postalCode?: string;
    country?: string;
  }[];
  links?: WcmpLink[];
  contactInstructions?: string;
  hoursOfService?: string;
  roles?: string[];
}

export interface WcmpLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
  hreflang?: string;
  channel?: string;
}

export interface ExternalId {
  scheme: string;
  value: string;
}

export interface Status {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
}

export interface TimeInterval {
  begin: string;
  end: string;
}

export type TimeExtent =
  | { date: string }
  | { timestamp: string }
  | { interval: [string, string] }
  | null;

export interface AdditionalExtents {
  spatial?: {
    bbox: [number, number, number, number][];
    crs?: string;
  };
  temporal?: {
    interval: [string, string][];
    resolution?: string;
    trs: string;
  };
}

export interface Wcmp2Record {
  id: string;
  type: 'Feature';
  conformsTo: string[];
  geometry: GeoJSON.Geometry | null;
  time: TimeExtent;
  properties: {
    type: string;
    title: string;
    description: string;
    themes: Theme[];
    contacts: Contact[];
    created: string;
    updated?: string;
    'wmo:dataPolicy': 'core' | 'recommended';
    keywords?: string[];
    version?: string;
    externalIds?: ExternalId[];
    status?: Status;
    rights?: string;
  };
  links: WcmpLink[];
  additionalExtents?: AdditionalExtents;
}

// Re-export GeoJSON types for convenience
export type { GeoJsonGeometryTypes, Geometry, Feature, BBox, Position } from 'geojson';
