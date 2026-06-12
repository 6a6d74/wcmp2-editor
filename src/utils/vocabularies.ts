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

// Fallback link relations — IANA standard + WCMP2 codelists.
// title === id for IANA entries (names are self-descriptive);
// title = short description for WCMP2-specific entries.
// Sources: https://www.iana.org/assignments/link-relations/link-relations-1.csv
//          https://github.com/wmo-im/wcmp2-codelists/blob/main/codelists/link-type.csv
export const LINK_RELATIONS = [
  // IANA (representative subset — full list loaded dynamically at runtime)
  { id: 'alternate',    title: 'alternate' },
  { id: 'archives',     title: 'archives' },
  { id: 'canonical',    title: 'canonical' },
  { id: 'cite-as',      title: 'cite-as' },
  { id: 'collection',   title: 'collection' },
  { id: 'describedby',  title: 'describedby' },
  { id: 'enclosure',    title: 'enclosure' },
  { id: 'item',         title: 'item' },
  { id: 'items',        title: 'items' },
  { id: 'license',      title: 'license' },
  { id: 'preview',      title: 'preview' },
  { id: 'related',      title: 'related' },
  { id: 'search',       title: 'search' },
  { id: 'self',         title: 'self' },
  { id: 'service',      title: 'service' },
  { id: 'service-desc', title: 'service-desc' },
  { id: 'service-doc',  title: 'service-doc' },
  { id: 'start',        title: 'start' },
  { id: 'type',         title: 'type' },
  { id: 'up',           title: 'up' },
  // WCMP2 codelists
  { id: 'data',         title: 'data' },
  { id: 'deletion',     title: 'deletion' },
  { id: 'station',      title: 'station' },
  { id: 'stations',     title: 'stations' },
  { id: 'update',       title: 'update' },
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
