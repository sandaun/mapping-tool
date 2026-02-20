'use client';

import type { DeviceSignal } from '@/lib/deviceSignals';
import type { Template } from '@/types/page.types';
import { useSignalsInput } from '@/hooks/useSignalsInput';
import { SignalLibraryModal } from '@/components/SignalLibraryModal';
import { SaveToLibraryDialog } from '@/components/SaveToLibraryDialog';
import { SavedSignalsBanner } from './SavedSignalsBanner';
import { AIUploadSection } from './AIUploadSection';
import { ManualCSVInput } from './ManualCSVInput';
import { InputWarnings } from './InputWarnings';
import { ParsedSignalsPanel } from './ParsedSignalsPanel';

// ---------------------------------------------------------------------------
// Props (public API — unchanged from the original component)
// ---------------------------------------------------------------------------

export type SignalsInputSectionProps = {
  template: Template;
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  onParseCSV: () => void;
  parseAndAddSignals: (csv: string) => void;
  onCopyPrompt: () => void;
  onGenerateSignals: (deviceCount?: number) => void;
  generateWithSignals: (signals: DeviceSignal[], deviceCount?: number) => void;
  onClearSignals: () => void;
  deviceSignals: DeviceSignal[];
  inputWarnings: string[];
  busy: boolean;
};

// ---------------------------------------------------------------------------
// Component (orchestrator — zero business logic)
// ---------------------------------------------------------------------------

export function SignalsInputSection(props: SignalsInputSectionProps) {
  const state = useSignalsInput(props);

  return (
    <div className="space-y-6">
      {/* Restore previously parsed signals */}
      {state.hasSavedData && (
        <SavedSignalsBanner onLoadSaved={state.handleLoadSaved} />
      )}

      {/* AI-powered file upload flow */}
      <AIUploadSection
        aiState={state.aiState}
        inputType={state.inputType}
        isKNXFlow={state.isKNXFlow}
        analyzingProvider={state.analyzingProvider}
        busy={state.busy}
        deviceCount={state.deviceCount}
        onDeviceCountChange={state.setDeviceCount}
        templateId={state.template.id}
        onFileSelect={state.handleFileSelect}
        onAcceptSignals={state.handleAcceptSignals}
        onReset={state.resetAI}
        onOpenLibrary={() => state.setShowLibraryModal(true)}
      />

      {/* Manual CSV input (collapsible) */}
      <ManualCSVInput
        csvInput={state.csvInput}
        onCsvInputChange={state.onCsvInputChange}
        onParseCSV={state.onParseCSV}
        onCopyPrompt={state.onCopyPrompt}
        promptText={state.template.promptText}
        busy={state.busy}
      />

      {/* Validation warnings */}
      <InputWarnings warnings={state.inputWarnings} />

      {/* Parsed signals preview + actions */}
      <ParsedSignalsPanel
        signalsCount={state.deviceSignals.length}
        signalsTableData={state.signalsTableData}
        deviceCount={state.deviceCount}
        onDeviceCountChange={state.setDeviceCount}
        isKNXFlow={state.isKNXFlow}
        canClear={state.canClear}
        busy={state.busy}
        onGenerate={state.handleManualGenerate}
        onClear={state.onClearSignals}
      />

      {/* Signal Library Modal */}
      <SignalLibraryModal
        open={state.showLibraryModal}
        onOpenChange={state.setShowLibraryModal}
        inputType={state.inputType}
        onLoad={state.handleLoadFromLibrary}
      />

      {/* Save to Library Dialog */}
      {state.saveDialogMeta && (
        <SaveToLibraryDialog
          open={state.showSaveDialog}
          onOpenChange={state.setShowSaveDialog}
          signals={state.saveDialogMeta.signals}
          inputType={state.saveDialogMeta.inputType}
          defaultManufacturer={state.saveDialogMeta.manufacturer}
          defaultModel={state.saveDialogMeta.model}
          parserProvider={state.saveDialogMeta.provider}
          parseWarnings={state.saveDialogMeta.warnings}
          confidenceStats={state.saveDialogMeta.confidenceStats}
          sourceFileName={state.saveDialogMeta.fileName}
          sourceFileType={state.saveDialogMeta.fileType}
          sourceFileSize={state.saveDialogMeta.fileSize}
        />
      )}
    </div>
  );
}
