import { describe, it, expect } from 'vitest';
import { scoreRecord, WEB_IMAGE_MIME_TYPES } from './kpiScorer';
import type { FormState } from '../hooks/useWcmp2Form';
import type { WcmpLink } from '../types/wcmp2';

function formWithLinks(links: Partial<WcmpLink>[]): FormState {
  return {
    title: '',
    description: '',
    timeType: 'none',
    contacts: [],
    externalIds: [],
    links,
  } as unknown as FormState;
}

function graphic(links: Partial<WcmpLink>[]) {
  return scoreRecord(formWithLinks(links)).results.find(r => r.id === 'graphic')!;
}

const preview = (type: string, href = 'https://example.org/preview') => ({ rel: 'preview', href, type });

describe('graphic overview KPI', () => {
  it('accepts image/svg+xml as a valid preview MIME type', () => {
    const r = graphic([preview('image/svg+xml')]);
    expect(r.score).toBe(3);
    expect(r.maxScore).toBe(3);
    expect(r.hints).toEqual([]);
  });

  it.each(WEB_IMAGE_MIME_TYPES)('accepts %s (matching pywcmp)', type => {
    expect(graphic([preview(type)]).score).toBe(3);
  });

  it('flags non-web-image MIME types', () => {
    const r = graphic([preview('image/tiff')]);
    expect(r.score).toBe(2);
    expect(r.hints.some(h => h.includes('web image MIME type'))).toBe(true);
  });

  it('scores 0/0 when there are no preview links (as pywcmp does)', () => {
    const r = graphic([{ rel: 'data', href: 'https://example.org/data', type: 'application/json' }]);
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(0);
  });

  it('does not lower the overall percentage when there is no preview link', () => {
    const withoutPreview = scoreRecord(formWithLinks([]));
    const graphicMax = withoutPreview.results.find(r => r.id === 'graphic')!.maxScore;
    expect(graphicMax).toBe(0);
    const sumMax = withoutPreview.results.reduce((s, r) => s + r.maxScore, 0);
    expect(withoutPreview.maxScore).toBe(sumMax);
  });

  it('scores every preview link, 3 points each (as pywcmp does)', () => {
    const r = graphic([
      preview('image/png', 'https://example.org/a.png'),
      preview('image/tiff', 'https://example.org/b.tif'),
      preview('image/svg+xml', 'ftp://example.org/c.svg'),
    ]);
    expect(r.maxScore).toBe(9);
    expect(r.score).toBe(3 + 2 + 2);
    expect(r.hints).toHaveLength(2);
  });
});

function pids(externalIds: { scheme: string; value: string }[], links: Partial<WcmpLink>[] = []) {
  const form = { ...formWithLinks(links), externalIds } as FormState;
  return scoreRecord(form).results.find(r => r.id === 'pids')!;
}

describe('persistent identifiers KPI', () => {
  it.each([
    'https://doi.org',
    'https://arks.org',
    'https://handle.net',
    'https://doi.org/',
    'http://dx.doi.org',
    'doi',
    'ark',
    'hdl',
  ])('credits %s as a DOI/ARK/HDL scheme', scheme => {
    const r = pids([{ scheme, value: '10.5065/D6FB50WB' }]);
    expect(r.score).toBe(2);
    expect(r.hints).not.toContain('Include a DOI, ARK, or HDL persistent identifier');
  });

  it('credits DOI, ARK and HDL together as written by the editor', () => {
    const r = pids([
      { scheme: 'https://doi.org', value: '10.5065/D6FB50WB' },
      { scheme: 'https://arks.org', value: 'ark:/86071/d2xb84' },
      { scheme: 'https://handle.net', value: '1912/27242' },
    ]);
    expect(r.score).toBe(2);
    expect(r.hints).not.toContain('Include a DOI, ARK, or HDL persistent identifier');
  });

  it.each(['https://example.org', 'https://doi.org.evil.com', 'isbn'])('does not credit %s', scheme => {
    const r = pids([{ scheme, value: 'x' }]);
    expect(r.score).toBe(1);
    expect(r.hints).toContain('Include a DOI, ARK, or HDL persistent identifier');
  });

  it('scores 3/3 with a DOI and a cite-as link', () => {
    const r = pids([{ scheme: 'https://doi.org', value: '10.5065/D6FB50WB' }], [
      { rel: 'cite-as', href: 'https://doi.org/10.5065/D6FB50WB', type: 'text/html' },
    ]);
    expect(r.score).toBe(3);
    expect(r.maxScore).toBe(3);
    expect(r.hints).toEqual([]);
  });

  it('scores 0/0 when there are no external identifiers (as pywcmp does)', () => {
    const r = pids([]);
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(0);
  });
});
