import { useMemo, useState, useCallback, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KpiPanel } from './components/kpi/KpiPanel';
import { ValidationPanel } from './components/validation/ValidationPanel';
import { ImportDialog } from './components/ImportDialog';
import { GitHubPushDialog } from './components/GitHubPushDialog';
import { IdentitySection } from './components/sections/IdentitySection';
import { PropertiesSection } from './components/sections/PropertiesSection';
import { ThemesSection } from './components/sections/ThemesSection';
import { GeospatialSection } from './components/sections/GeospatialSection';
import { TemporalSection } from './components/sections/TemporalSection';
import { ContactsSection } from './components/sections/ContactsSection';
import { DataPolicySection } from './components/sections/DataPolicySection';
import { LinksSection } from './components/sections/LinksSection';
import { OptionalSection } from './components/sections/OptionalSection';
import { JsonPreviewSection } from './components/sections/JsonPreviewSection';
import { useWcmp2Form } from './hooks/useWcmp2Form';
import { useVocabulary } from './hooks/useVocabulary';
import { useValidation } from './hooks/useValidation';
import { scoreRecord } from './utils/kpiScorer';
import { buildRecord, downloadRecord } from './utils/wcmp2Builder';
import type { FormState } from './hooks/useWcmp2Form';

export default function App() {
  const { form, update, reset, load } = useWcmp2Form();
  const vocab = useVocabulary();
  const { result: validationResult, validate, clear: clearValidation } = useValidation();
  const [showValidation, setShowValidation] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const awaitingFirstEdit = useRef(false);

  const record = useMemo(() => buildRecord(form), [form]);
  const kpi = useMemo(() => scoreRecord(form), [form]);

  // Intercepts the first user edit after an import and asks about the updated timestamp.
  const handleUpdate = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    update(key, value);
    if (awaitingFirstEdit.current && key !== 'updated') {
      awaitingFirstEdit.current = false;
      setShowUpdatePrompt(true);
    }
  }, [update]);

  const handleValidate = async () => {
    setShowValidation(true);
    await validate(record);
  };

  const handleDownload = () => downloadRecord(record);

  const handleReset = () => {
    if (window.confirm('Reset all fields? This cannot be undone.')) {
      reset();
      awaitingFirstEdit.current = false;
    }
  };

  const handleImport = (importedForm: FormState) => {
    load(importedForm);
    setShowImport(false);
    awaitingFirstEdit.current = true;
  };

  const handleUpdatePromptYes = () => {
    update('updated', new Date().toISOString().slice(0, 19));
    setShowUpdatePrompt(false);
  };

  const handleUpdatePromptNo = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onValidate={handleValidate}
        onDownload={handleDownload}
        onReset={handleReset}
        onImport={() => setShowImport(true)}
        onPushToGitHub={() => setShowGitHub(true)}
        validating={validationResult.loading}
      />

      <Sidebar kpi={kpi} />

      <main className="ml-48 pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          <KpiPanel kpi={kpi} />

          <IdentitySection form={form} update={handleUpdate} />
          <PropertiesSection form={form} update={handleUpdate} resourceTypes={vocab.resourceTypes} />
          <ThemesSection form={form} update={handleUpdate} disciplines={vocab.disciplines} />
          <GeospatialSection form={form} update={handleUpdate} />
          <TemporalSection form={form} update={handleUpdate} />
          <ContactsSection form={form} update={handleUpdate} contactRoles={vocab.contactRoles} />
          <DataPolicySection form={form} update={handleUpdate} />
          <LinksSection form={form} update={handleUpdate} />
          <OptionalSection form={form} update={handleUpdate} />
          <JsonPreviewSection record={record} />

          <div className="pb-10 text-center text-xs text-gray-400">
            WMO Core Metadata Profile v2 Editor — records validated by{' '}
            <a
              href="https://wis2-gdc.weather.gc.ca"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              wis2-gdc.weather.gc.ca
            </a>
          </div>
        </div>
      </main>

      {showValidation && (
        <ValidationPanel
          result={validationResult}
          onClose={() => {
            setShowValidation(false);
            clearValidation();
          }}
        />
      )}

      {showImport && (
        <ImportDialog
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showGitHub && (
        <GitHubPushDialog
          record={record}
          form={form}
          onClose={() => setShowGitHub(false)}
        />
      )}

      {showUpdatePrompt && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Update metadata timestamp?</h2>
            <p className="text-sm text-gray-600">
              You've started editing this imported record. Do you want to update the{' '}
              <strong>updated</strong> date-time to now?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleUpdatePromptNo}
                className="px-4 py-2 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                No, keep existing
              </button>
              <button
                onClick={handleUpdatePromptYes}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Yes, update to now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
