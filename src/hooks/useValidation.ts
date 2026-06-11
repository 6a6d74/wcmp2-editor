import { useState, useCallback } from 'react';
import type { Wcmp2Record } from '../types/wcmp2';

const ETS_URL =
  'https://wis2-gdc.weather.gc.ca/processes/pywcmp-wis2-wcmp2-ets/execution';
const KPI_URL =
  'https://wis2-gdc.weather.gc.ca/processes/pywcmp-wis2-wcmp2-kpi/execution';

export interface EtsTestResult {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
}

export interface ValidationResult {
  ets: {
    passed: boolean;
    version?: string;
    tests: EtsTestResult[];
  } | null;
  kpi: {
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
  } | null;
  error: string | null;
  loading: boolean;
}

function formatTestTitle(id: string): string {
  const segment = id.split('/').pop() || id;
  return segment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseEtsResponse(data: Record<string, unknown>): ValidationResult['ets'] {
  // Current API format: { tests: [{id, code, message}], generated_by, summary: {PASSED, FAILED} }
  if (Array.isArray(data.tests)) {
    const tests: EtsTestResult[] = (data.tests as Record<string, unknown>[]).map(t => ({
      id: String(t.id || ''),
      title: formatTestTitle(String(t.id || '')),
      status: (String(t.code || '').toLowerCase()) as EtsTestResult['status'],
      message: t.message ? String(t.message) : undefined,
    }));
    const passed = tests.every(t => t.status !== 'failed');
    const generatedBy = String(data.generated_by || '');
    const version = generatedBy.match(/pywcmp ([\d.]+)/)?.[1] || '';
    return { passed, tests, version };
  }

  // Legacy nested format: { outputs: { report: { suites: [...] } } }
  const report =
    (data?.outputs as Record<string, unknown>)?.report as Record<string, unknown> | undefined;
  if (!report) return { passed: false, tests: [], version: '' };

  const suite = (report.suites as Record<string, unknown>[])?.[0];
  const tests: EtsTestResult[] = [];
  function extractTests(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (n.title && n.status) {
      tests.push({
        id: String(n.id || n.title),
        title: String(n.title),
        status: String(n.status) as EtsTestResult['status'],
        message: n.message ? String(n.message) : undefined,
      });
    }
    if (Array.isArray(n.tests)) n.tests.forEach(extractTests);
    if (Array.isArray(n.suites)) n.suites.forEach(extractTests);
  }
  extractTests(suite);

  const passed = tests.every(t => t.status !== 'failed');
  return {
    passed,
    version: String(report.version || (data as Record<string, unknown>).version || ''),
    tests,
  };
}

function parseKpiResponse(data: Record<string, unknown>): ValidationResult['kpi'] {
  // Current API format: { summary: { total, score, percentage, grade } }
  const summary = data.summary as Record<string, unknown> | undefined;
  if (summary && typeof summary.score === 'number') {
    return {
      score: Number(summary.score),
      maxScore: Number(summary.total ?? 0),
      percentage: Number(summary.percentage ?? 0),
      grade: String(summary.grade || ''),
    };
  }

  // Legacy format: { outputs: { summary: { score, maxScore, percentage, grade } } }
  const legacySummary = ((data?.outputs as Record<string, unknown>) || {})
    .summary as Record<string, unknown> | undefined;
  if (legacySummary) {
    return {
      score: Number(legacySummary.score || 0),
      maxScore: Number(legacySummary.maxScore || legacySummary.max_score || 0),
      percentage: Number(legacySummary.percentage || 0),
      grade: String(legacySummary.grade || ''),
    };
  }
  return null;
}

function parseProcessError(description: string): string {
  // The service returns errors like:
  // "Error executing process: ('Record fails WCMP2 validation. ...', 'errors: [\"...\"]')"
  // Extract and clean up the JSON Schema errors list where possible.
  const errMatch = description.match(/errors: \[(.+?)\](?:'|$)/s);
  if (errMatch) {
    const raw = errMatch[1];
    const errors = raw
      .split(/\\",\s*\\"/)
      .map(e => e.replace(/^\\?"|\\?"$/g, '').replace(/\\\\'/g, "'").replace(/\\'/g, "'").replace(/\$: /, ''))
      .map(e => e.trim())
      .filter(Boolean);
    if (errors.length > 0) {
      return `The record does not meet the WCMP2 schema requirements. Missing or invalid: ${errors.join('; ')}.`;
    }
  }
  // Strip Python boilerplate and return the core message
  return description
    .replace(/^Error executing process:\s*/, '')
    .replace(/^\('([^']+)',.*\)$/, '$1')
    .trim() || 'The validation service rejected the record. Check all required fields are filled in.';
}

export function useValidation() {
  const [result, setResult] = useState<ValidationResult>({
    ets: null,
    kpi: null,
    error: null,
    loading: false,
  });

  const validate = useCallback(async (record: Wcmp2Record) => {
    setResult({ ets: null, kpi: null, error: null, loading: true });

    const body = JSON.stringify({ inputs: { record } });
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };

    const fetchJson = async (url: string): Promise<Record<string, unknown>> => {
      let res: Response;
      try {
        res = await fetch(url, { method: 'POST', headers, body });
      } catch {
        throw new Error(
          'Could not reach the validation service. Check your internet connection and try again.'
        );
      }

      let data: Record<string, unknown>;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        throw new Error(
          `The validation service returned an unreadable response (HTTP ${res.status}). Please try again later.`
        );
      }

      if (!res.ok) {
        // HTTP 400 from OGC API Processes means the process ran but the input was rejected.
        // Parse the error description from the body rather than showing a generic message.
        const desc = typeof data.description === 'string' ? data.description : '';
        throw new Error(desc ? parseProcessError(desc) : `Validation request failed (HTTP ${res.status}). Please try again later.`);
      }

      return data;
    };

    try {
      const [etsRes, kpiRes] = await Promise.allSettled([
        fetchJson(ETS_URL),
        fetchJson(KPI_URL),
      ]);

      const ets = etsRes.status === 'fulfilled' ? parseEtsResponse(etsRes.value) : null;
      const kpi = kpiRes.status === 'fulfilled' ? parseKpiResponse(kpiRes.value) : null;

      const error =
        etsRes.status === 'rejected'
          ? (etsRes as PromiseRejectedResult).reason instanceof Error
            ? ((etsRes as PromiseRejectedResult).reason as Error).message
            : 'ETS validation failed. Please try again.'
          : null;

      setResult({ ets, kpi, error, loading: false });
    } catch (err) {
      setResult({
        ets: null,
        kpi: null,
        error: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        loading: false,
      });
    }
  }, []);

  const clear = useCallback(() => {
    setResult({ ets: null, kpi: null, error: null, loading: false });
  }, []);

  return { result, validate, clear };
}
