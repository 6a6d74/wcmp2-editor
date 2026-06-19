import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export type TestStatus = 'idle' | 'loading' | 'ok' | 'redirect' | 'error' | 'failed';
export interface TestResult { status: TestStatus; code?: number }

export function TestBadge({ status, code }: { status: TestStatus; code?: number }) {
  if (status === 'loading') return <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Testing…</span>;
  if (status === 'ok') return <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle size={12} /> OK {code && `(${code})`}</span>;
  if (status === 'redirect') return <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertCircle size={12} /> Redirect {code && `(${code})`}</span>;
  if (status === 'error') return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Error {code && `(${code})`}</span>;
  if (status === 'failed') return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Could not connect</span>;
  return null;
}

export const isHttpUrl = (v: string) => /^https?:\/\/.+/i.test(v);
export const isValidUrl = (v: string) => !v || /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(v);
export const isValidHttpUrl = (v: string) => !v || isHttpUrl(v);

export async function testUrl(url: string): Promise<TestResult> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const code = res.status;
    return { status: code < 300 ? 'ok' : code < 400 ? 'redirect' : 'error', code };
  } catch {
    return { status: 'failed' };
  }
}
