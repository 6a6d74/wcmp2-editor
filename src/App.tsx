import { useMemo, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KpiPanel } from './components/kpi/KpiPanel';
import { ValidationPanel } from './components/validation/ValidationPanel';
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

export default function App() {
  const { form, update, reset } = useWcmp2Form();
  const vocab = useVocabulary();
  const { result: validationResult, validate, clear: clearValidation } = useValidation();
  const [showValidation, setShowValidation] = useState(false);

  const record = useMemo(() => buildRecord(form), [form]);
  const kpi = useMemo(() => scoreRecord(form), [form]);

  const handleValidate = async () => {
    setShowValidation(true);
    await validate(record);
  };

  const handleDownload = () => downloadRecord(record);

  const handleReset = () => {
    if (window.confirm('Reset all fields? This cannot be undone.')) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onValidate={handleValidate}
        onDownload={handleDownload}
        onReset={handleReset}
        validating={validationResult.loading}
      />

      <Sidebar kpi={kpi} />

      <main className="ml-48 pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          <KpiPanel kpi={kpi} />

          <IdentitySection form={form} update={update} />
          <PropertiesSection form={form} update={update} resourceTypes={vocab.resourceTypes} />
          <ThemesSection form={form} update={update} disciplines={vocab.disciplines} />
          <GeospatialSection form={form} update={update} />
          <TemporalSection form={form} update={update} />
          <ContactsSection form={form} update={update} contactRoles={vocab.contactRoles} />
          <DataPolicySection form={form} update={update} />
          <LinksSection form={form} update={update} />
          <OptionalSection form={form} update={update} />
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
    </div>
  );
}
