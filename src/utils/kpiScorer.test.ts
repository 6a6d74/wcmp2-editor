import { describe, it, expect } from 'vitest';
import { scoreRecord, WEB_IMAGE_MIME_TYPES } from './kpiScorer';
import type { FormState } from '../hooks/useWcmp2Form';

function formWithPreview(type: string): FormState {
  return {
    title: '',
    description: '',
    timeType: 'none',
    contacts: [],
    externalIds: [],
    links: [{ rel: 'preview', href: 'https://example.org/preview', type }],
  } as unknown as FormState;
}

function graphicResult(type: string) {
  return scoreRecord(formWithPreview(type)).results.find(r => r.id === 'graphic')!;
}

describe('graphic overview KPI', () => {
  it('accepts image/svg+xml as a valid preview MIME type', () => {
    const r = graphicResult('image/svg+xml');
    expect(r.score).toBe(r.maxScore);
    expect(r.hints).toEqual([]);
  });

  it.each(WEB_IMAGE_MIME_TYPES)('accepts %s (matching pywcmp)', type => {
    expect(graphicResult(type).score).toBe(3);
  });

  it('flags non-image MIME types', () => {
    const r = graphicResult('image/tiff');
    expect(r.score).toBe(2);
    expect(r.hints.some(h => h.includes('web image MIME type'))).toBe(true);
  });
});
