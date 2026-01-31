'use client';

import { useMemo } from 'react';
import { applyOverridesToWorkbook } from '@/lib/overrides';
import { useFileImport } from '@/hooks/useFileImport';
import { useTemplateManager } from '@/hooks/useTemplateManager';
import { useSignalsWorkflow } from '@/hooks/useSignalsWorkflow';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ProtocolsInfo } from '@/components/ProtocolsInfo';
import { DeviceSignalsSection } from '@/components/DeviceSignalsSection';
import { ResultsSection } from '@/components/ResultsSection';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Header } from '@/components/Header';
import type { Override } from '@/types/overrides';

export default function Home() {
  // File import management
  const { raw, setRaw, protocols, error, busy, importArrayBufferAsFile } =
    useFileImport();

  // Template management with proper reset callback
  const {
    selectedTemplateId,
    selectedTemplate,
    handleTemplateChange,
    loadTemplate,
    loadCustomFile,
  } = useTemplateManager(importArrayBufferAsFile, () => {
    // Reset will be handled by signals workflow
  });

  // Signals workflow management
  const {
    csvInput,
    deviceSignals,
    parseWarnings,
    pendingExport,
    setCsvInput,
    parseAndAddSignals,
    handleParseCSV,
    handleClearSignals,
    handleGenerateSignals,
    generateWithSignals,
    resetPendingExport,
  } = useSignalsWorkflow(selectedTemplate, raw, setRaw);

  // Computed values
  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw],
  );

  // Event handlers
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(selectedTemplate.promptText);
  };

  const handleExport = async (overrides: Override[]) => {
    if (!raw) return;

    try {
      const workbookToExport = applyOverridesToWorkbook(
        raw,
        overrides,
        selectedTemplateId,
      );

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workbookToExport),
      });

      if (!res.ok) {
        throw new Error('Error exportant.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      resetPendingExport();
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {/* Gateway Templates */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Gateway Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a gateway type to automatically load the template.
          </p>

          <TemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            onLoadTemplate={loadTemplate}
            onCustomFileSelect={loadCustomFile}
            busy={busy}
          />

          <ProtocolsInfo protocols={protocols} />
        </section>

        {/* Import device signals */}
        {raw && (
          <DeviceSignalsSection
            template={selectedTemplate}
            csvInput={csvInput}
            onCsvInputChange={setCsvInput}
            onParseCSV={handleParseCSV}
            parseAndAddSignals={parseAndAddSignals}
            onCopyPrompt={handleCopyPrompt}
            onGenerateSignals={handleGenerateSignals}
            generateWithSignals={generateWithSignals}
            onClearSignals={handleClearSignals}
            deviceSignals={deviceSignals}
            parseWarnings={parseWarnings}
            busy={busy}
          />
        )}

        {/* Errors */}
        <ErrorDisplay error={error} />

        {/* Results */}
        {raw && (
          <ResultsSection
            raw={raw}
            sheetNames={sheetNames}
            onExport={handleExport}
            busy={busy}
            pendingExport={pendingExport}
            templateId={selectedTemplateId}
          />
        )}
      </main>
    </div>
  );
}
