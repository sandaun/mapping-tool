import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { applyOverridesToWorkbook } from '@/lib/overrides';
import { useFileImport } from '@/hooks/useFileImport';
import { useTemplateManager } from '@/hooks/useTemplateManager';
import { useSignalsWorkflow } from '@/hooks/useSignalsWorkflow';
import type { Override } from '@/types/overrides';
import type { TemplateId } from '@/types/page.types';

// ---------------------------------------------------------------------------
// Hook — composes child hooks + page-level orchestration logic
// ---------------------------------------------------------------------------

export function usePageOrchestrator() {
  // ---- Child hooks ----

  const fileImport = useFileImport();
  const {
    raw,
    setRaw,
    protocols,
    error,
    templateLoading,
    importArrayBufferAsFile,
    originalIbmaps,
  } = fileImport;

  const templateManager = useTemplateManager(importArrayBufferAsFile, false);
  const {
    selectedTemplateId,
    selectedTemplate,
    handleTemplateChange: setTemplateId,
    loadTemplate,
    loadCustomFile,
  } = templateManager;

  const signalsWorkflow = useSignalsWorkflow(selectedTemplate, raw, setRaw);
  const { pendingExport, resetPendingExport } = signalsWorkflow;

  // ---- Step collapse state ----

  const [step1Collapsed, setStep1Collapsed] = useState(false);
  const [step2Collapsed, setStep2Collapsed] = useState(false);

  // Auto-collapse steps 1 & 2 when signals are first generated
  const prevPendingExportRef = useRef(pendingExport);
  useEffect(() => {
    if (prevPendingExportRef.current === null && pendingExport !== null) {
      setStep1Collapsed(true);
      setStep2Collapsed(true);
    }
    prevPendingExportRef.current = pendingExport;
  }, [pendingExport]);

  // ---- Template change confirmation ----

  const [pendingTemplateId, setPendingTemplateId] = useState<TemplateId | null>(
    null,
  );

  const handleTemplateChange = useCallback(
    (templateId: TemplateId) => {
      if (templateId === selectedTemplateId) return;

      if (pendingExport) {
        setPendingTemplateId(templateId);
      } else {
        setTemplateId(templateId);
        loadTemplate(templateId);
        setStep1Collapsed(true);
      }
    },
    [pendingExport, selectedTemplateId, setTemplateId, loadTemplate],
  );

  const handleConfirmTemplateChange = useCallback(() => {
    if (!pendingTemplateId) return;
    resetPendingExport();
    setTemplateId(pendingTemplateId);
    loadTemplate(pendingTemplateId);
    setPendingTemplateId(null);
    setStep1Collapsed(false);
    setStep2Collapsed(false);
  }, [pendingTemplateId, resetPendingExport, setTemplateId, loadTemplate]);

  const handleCancelTemplateChange = useCallback(() => {
    setPendingTemplateId(null);
  }, []);

  // ---- Reset confirmation ----

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetRequest = useCallback(() => {
    if (pendingExport) {
      setShowResetConfirm(true);
    } else {
      resetPendingExport();
    }
  }, [pendingExport, resetPendingExport]);

  const handleConfirmReset = useCallback(() => {
    resetPendingExport();
    loadTemplate(selectedTemplateId);
    setShowResetConfirm(false);
    setStep1Collapsed(false);
    setStep2Collapsed(false);
  }, [resetPendingExport, loadTemplate, selectedTemplateId]);

  // ---- Export ----

  const handleExport = useCallback(
    async (overrides: Override[]) => {
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

        if (!res.ok) throw new Error('Error exportant.');

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
    },
    [raw, selectedTemplateId],
  );

  // ---- Copy prompt ----

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(selectedTemplate.promptText);
  }, [selectedTemplate.promptText]);

  // ---- Derived ----

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw],
  );

  // ---- Public API ----

  return {
    // File import
    raw,
    protocols,
    error,
    templateLoading,
    originalIbmaps,

    // Template
    selectedTemplateId,
    selectedTemplate,
    loadCustomFile,

    // Signals workflow (pass-through)
    csvInput: signalsWorkflow.csvInput,
    deviceSignals: signalsWorkflow.deviceSignals,
    inputWarnings: signalsWorkflow.inputWarnings,
    pendingExport: signalsWorkflow.pendingExport,
    setCsvInput: signalsWorkflow.setCsvInput,
    parseAndAddSignals: signalsWorkflow.parseAndAddSignals,
    handleParseCSV: signalsWorkflow.handleParseCSV,
    handleClearSignals: signalsWorkflow.handleClearSignals,
    handleGenerateSignals: signalsWorkflow.handleGenerateSignals,
    generateWithSignals: signalsWorkflow.generateWithSignals,

    // Step collapse
    step1Collapsed,
    setStep1Collapsed,
    step2Collapsed,
    setStep2Collapsed,

    // Template change confirmation
    pendingTemplateId,
    handleTemplateChange,
    handleConfirmTemplateChange,
    handleCancelTemplateChange,

    // Reset confirmation
    showResetConfirm,
    setShowResetConfirm,
    handleResetRequest,
    handleConfirmReset,

    // Actions
    handleExport,
    handleCopyPrompt,

    // Derived
    sheetNames,
  } as const;
}
