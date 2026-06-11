import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ValidationResult } from '../../hooks/useValidation';

interface Props {
  result: ValidationResult;
  onClose: () => void;
}

export function ValidationPanel({ result, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-lg">Validation Results</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Loading */}
          {result.loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Waiting for validation results…</p>
            </div>
          )}

          {/* Error */}
          {!result.loading && result.error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-800">Validation could not be completed</div>
                <div className="text-sm text-red-700 mt-0.5">{result.error}</div>
              </div>
            </div>
          )}

          {/* ETS Results */}
          {!result.loading && result.ets && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-semibold text-gray-800">Essential Test Suite (ETS)</h3>
                {result.ets.passed ? (
                  <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-sm font-medium">
                    <CheckCircle size={14} /> PASSED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-sm font-medium">
                    <XCircle size={14} /> FAILED
                  </span>
                )}
                {result.ets.version && (
                  <span className="text-xs text-gray-400 ml-auto">pywcmp {result.ets.version}</span>
                )}
              </div>

              {result.ets.tests.length > 0 ? (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                  {result.ets.tests.map((test, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                      {test.status === 'passed' ? (
                        <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
                      ) : test.status === 'failed' ? (
                        <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm text-gray-700 font-medium">{test.title}</div>
                        {test.message && (
                          <div className="text-xs text-red-600 mt-0.5 break-words">{test.message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {result.ets.passed
                    ? 'All conformance tests passed.'
                    : 'No detailed test breakdown available.'}
                </div>
              )}
            </div>
          )}

          {/* KPI Results from API */}
          {!result.loading && result.kpi && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">KPI Assessment (API)</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-4xl font-bold text-gray-700">{result.kpi.grade}</span>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {result.kpi.percentage}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.kpi.score}/{result.kpi.maxScore} points
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
