export const RESOURCE_TYPES = [
  { id: 'dataset', title: 'Dataset', description: 'A collection of data' },
  { id: 'service', title: 'Service', description: 'A capability which receives a request and returns a response' },
  { id: 'process', title: 'Process', description: 'A process or workflow that transforms data' },
];

export const DATA_POLICIES = [
  { id: 'core', title: 'Core', description: 'Freely and openly shared without restriction' },
  { id: 'recommended', title: 'Recommended', description: 'Shared according to defined access terms' },
];

// WCMP2 contact roles — source: https://github.com/wmo-im/wcmp2-codelists/blob/main/codelists/contact-role.csv
export const CONTACT_ROLES = [
  'licensor',
  'producer',
  'processor',
  'host',
  'publisher',
];

export const LINK_RELATIONS = [
  // IANA standard
  { id: 'alternate', title: 'Alternate representation' },
  { id: 'canonical', title: 'Canonical URL' },
  { id: 'describedby', title: 'Described by' },
  { id: 'enclosure', title: 'Data enclosure (download)' },
  { id: 'item', title: 'Item (single record)' },
  { id: 'items', title: 'Items collection' },
  { id: 'license', title: 'License' },
  { id: 'related', title: 'Related resource' },
  { id: 'self', title: 'This document' },
  { id: 'service', title: 'Service' },
  { id: 'service-doc', title: 'Service documentation' },
  { id: 'service-desc', title: 'Service description' },
  { id: 'start', title: 'Start / home' },
  { id: 'type', title: 'Type' },
  { id: 'up', title: 'Parent' },
  // OGC / WIS extensions
  { id: 'archives', title: 'Archives (historical data)' },
  { id: 'cite-as', title: 'Cite as (preferred citation)' },
  { id: 'collection', title: 'Parent collection' },
  { id: 'conformance', title: 'Conformance' },
  { id: 'data', title: 'Data' },
  { id: 'preview', title: 'Preview / thumbnail image' },
  { id: 'root', title: 'Landing page' },
  { id: 'search', title: 'Search interface' },
  { id: 'subsetting', title: 'Subsetting / filter interface' },
];

export const MIME_TYPES = [
  'application/json',
  'application/geo+json',
  'application/ld+json',
  'application/xml',
  'application/gzip',
  'application/zip',
  'application/octet-stream',
  'application/pdf',
  'text/html',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/tiff',
];

export const EARTH_SYSTEM_DISCIPLINES = [
  { id: 'atmosphericComposition', title: 'Atmospheric Composition' },
  { id: 'atmosphericDynamics', title: 'Atmospheric Dynamics' },
  { id: 'atmosphericThermodynamics', title: 'Atmospheric Thermodynamics' },
  { id: 'cryosphere', title: 'Cryosphere' },
  { id: 'hydrosphere', title: 'Hydrosphere' },
  { id: 'landSurface', title: 'Land Surface' },
  { id: 'oceanography', title: 'Oceanography' },
  { id: 'outerSpace', title: 'Outer Space' },
  { id: 'space', title: 'Space' },
  { id: 'terrestrialEcosystems', title: 'Terrestrial Ecosystems' },
  { id: 'weather', title: 'Weather' },
];

export const EARTH_SYSTEM_DISCIPLINE_SCHEME =
  'http://codes.wmo.int/wis/topic-hierarchy/earth-system-discipline';

export const TEMPORAL_RESOLUTIONS = [
  { id: 'PT1M', title: '1 minute' },
  { id: 'PT5M', title: '5 minutes' },
  { id: 'PT10M', title: '10 minutes' },
  { id: 'PT15M', title: '15 minutes' },
  { id: 'PT30M', title: '30 minutes' },
  { id: 'PT1H', title: '1 hour' },
  { id: 'PT3H', title: '3 hours' },
  { id: 'PT6H', title: '6 hours' },
  { id: 'PT12H', title: '12 hours' },
  { id: 'P1D', title: '1 day' },
  { id: 'P1W', title: '1 week' },
  { id: 'P1M', title: '1 month' },
  { id: 'P3M', title: '3 months' },
  { id: 'P1Y', title: '1 year' },
];
