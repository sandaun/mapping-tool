'use client';

import { useMemo, useState, useCallback } from 'react';
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
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StepSection } from '@/components/ui/StepSection';
import type { Override } from '@/types/overrides';
import type { TemplateId } from '@/types/page.types';

export default function Home() {
  // File import management
  const {
    raw,
    setRaw,
    protocols,
    error,
    busy,
    importArrayBufferAsFile,
    originalIbmaps,
  } = useFileImport();

  // Pending template change for confirmation dialog
  const [pendingTemplateId, setPendingTemplateId] = useState<TemplateId | null>(
    null,
  );

  // Template management - we'll handle confirmation in page.tsx
  const {
    selectedTemplateId,
    selectedTemplate,
    handleTemplateChange: setTemplateId,
    loadTemplate,
    loadCustomFile,
  } = useTemplateManager(importArrayBufferAsFile, false);

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

  // Handle template change with confirmation
  const handleTemplateChange = useCallback(
    (templateId: TemplateId) => {
      if (pendingExport) {
        // There are pending changes - ask for confirmation
        setPendingTemplateId(templateId);
      } else {
        // No pending changes - proceed directly
        setTemplateId(templateId);
      }
    },
    [pendingExport, setTemplateId],
  );

  // Confirm template change
  const handleConfirmTemplateChange = useCallback(() => {
    if (pendingTemplateId) {
      resetPendingExport();
      setTemplateId(pendingTemplateId);
      setPendingTemplateId(null);
    }
  }, [pendingTemplateId, resetPendingExport, setTemplateId]);

  // Cancel template change
  const handleCancelTemplateChange = useCallback(() => {
    setPendingTemplateId(null);
  }, []);

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

      // Update timestamp to current date
      const signalsSheet = workbookToExport.sheets.find(
        (s) => s.name === 'Signals',
      );
      if (signalsSheet) {
        // Find the row that contains 'Timestamp' in column A
        const timestampRowIndex = signalsSheet.rows.findIndex(
          (row) => row[0] === 'Timestamp',
        );
        if (timestampRowIndex !== -1) {
          signalsSheet.rows[timestampRowIndex][1] =
            new Date().toLocaleDateString();
        }
      }

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
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Loading overlay during template/file loading */}
      <LoadingOverlay visible={busy} message="Loading template..." />

      {/* Confirmation dialog for template change with pending signals */}
      <ConfirmDialog
        open={pendingTemplateId !== null}
        onOpenChange={(open) => !open && handleCancelTemplateChange()}
        title="Unsaved changes"
        description={`You have ${pendingExport?.signalsCount ?? 0} signals pending export. Changing template will discard them. Continue?`}
        confirmText="Discard & Change"
        cancelText="Keep editing"
        confirmVariant="danger"
        onConfirm={handleConfirmTemplateChange}
        onCancel={handleCancelTemplateChange}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {/* Step 1: Gateway Templates */}
        <StepSection
          stepNumber={1}
          title="Gateway Templates"
          description="Select a gateway type to automatically load the template."
        >
          <TemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            onLoadTemplate={loadTemplate}
            onCustomFileSelect={loadCustomFile}
            busy={busy}
          />

          <ProtocolsInfo protocols={protocols} />
        </StepSection>

        {/* Step 2: Import device signals */}
        {raw && (
          <StepSection
            stepNumber={2}
            title="Import Device Signals"
            description="Parse signals from CSV or AI-extracted data."
          >
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
          </StepSection>
        )}

        {/* Errors */}
        <ErrorDisplay error={error} />

        {/* Step 3: Results */}
        {raw && (
          <StepSection
            stepNumber={3}
            title="Generated Output"
            description={`Sheets: ${sheetNames.join(', ')}`}
          >
            <ResultsSection
              raw={raw}
              onExport={handleExport}
              onReset={resetPendingExport}
              busy={busy}
              pendingExport={pendingExport}
              templateId={selectedTemplateId}
              originalIbmaps={originalIbmaps}
            />
          </StepSection>
        )}
      </main>
    </div>
  );
}
