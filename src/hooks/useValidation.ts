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

function parseEtsResponse(data: Record<string, unknown>): ValidationResult['ets'] {
  // pywcmp returns: { outputs: { report: { ... } } }
  const report =
    (data?.outputs as Record<string, unknown>)?.report as Record<string, unknown> | undefined;

  if (!report) {
    // Try legacy flat structure
    const tests = Array.isArray((data as Record<string, unknown>).tests)
      ? ((data as Record<string, unknown>).tests as EtsTestResult[])
      : [];
    const passed = tests.every(t => t.status !== 'failed');
    return { passed, tests, version: String((data as Record<string, unknown>).version || '') };
  }

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
  const outputs = (data?.outputs as Record<string, unknown>) || {};
  const summary = outputs.summary as Record<string, unknown> | undefined;
  if (summary) {
    return {
      score: Number(summary.score || 0),
      maxScore: Number(summary.maxScore || summary.max_score || 0),
      percentage: Number(summary.percentage || 0),
      grade: String(summary.grade || ''),
    };
  }
  return null;
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

    try {
      const [etsRes, kpiRes] = await Promise.allSettled([
        fetch(ETS_URL, { method: 'POST', headers, body }).then(r => r.json()),
        fetch(KPI_URL, { method: 'POST', headers, body }).then(r => r.json()),
      ]);

      const ets =
        etsRes.status === 'fulfilled' ? parseEtsResponse(etsRes.value as Record<string, unknown>) : null;
      const kpi =
        kpiRes.status === 'fulfilled' ? parseKpiResponse(kpiRes.value as Record<string, unknown>) : null;

      const error =
        etsRes.status === 'rejected'
          ? `ETS validation failed: ${String((etsRes as PromiseRejectedResult).reason)}`
          : null;

      setResult({ ets, kpi, error, loading: false });
    } catch (err) {
      setResult({
        ets: null,
        kpi: null,
        error: `Network error: ${String(err)}`,
        loading: false,
      });
    }
  }, []);

  const clear = useCallback(() => {
    setResult({ ets: null, kpi: null, error: null, loading: false });
  }, []);

  return { result, validate, clear };
}
