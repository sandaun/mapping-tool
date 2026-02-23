'use client';

import { usePageOrchestrator } from '@/hooks/usePageOrchestrator';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CollapsedProtocolLabel } from '@/components/ProtocolsInfo';
import { SignalsInputSection } from '@/components/signals-input';
import { ResultsSection } from '@/components/results-section';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StepSection } from '@/components/ui/StepSection';

// ---------------------------------------------------------------------------
// Page (orchestrator — zero business logic)
// ---------------------------------------------------------------------------

export default function Home() {
  const state = usePageOrchestrator();

  return (
    <div className="bg-background">
      <Header />

      <LoadingOverlay visible={state.busy} message="Loading template..." />

      {/* Confirmation dialog for template change with pending signals */}
      <ConfirmDialog
        open={state.pendingTemplateId !== null}
        onOpenChange={(open) => !open && state.handleCancelTemplateChange()}
        title="Unsaved changes"
        description={`You have ${state.pendingExport?.signalsCount ?? 0} signals pending export. Changing template will discard them. Continue?`}
        confirmText="Discard & Change"
        cancelText="Keep editing"
        confirmVariant="danger"
        onConfirm={state.handleConfirmTemplateChange}
        onCancel={state.handleCancelTemplateChange}
      />

      {/* Confirmation dialog for Reset Signals */}
      <ConfirmDialog
        open={state.showResetConfirm}
        onOpenChange={(open) => !open && state.setShowResetConfirm(false)}
        title="Reset signals"
        description={`You have ${state.pendingExport?.signalsCount ?? 0} signals pending export. Resetting will reload the template and discard all generated signals. Continue?`}
        confirmText="Reset"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={state.handleConfirmReset}
        onCancel={() => state.setShowResetConfirm(false)}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {/* Step 1: Gateway Templates */}
        <StepSection
          stepNumber={1}
          title="Gateway Templates"
          collapsible={!!state.raw}
          collapsed={state.step1Collapsed}
          onCollapsedChange={state.setStep1Collapsed}
          collapsedLabel={
            <CollapsedProtocolLabel
              templateLabel={state.selectedTemplate.label}
            />
          }
        >
          <TemplateSelector
            selectedTemplateId={state.selectedTemplateId}
            onTemplateChange={state.handleTemplateChange}
            onCustomFileSelect={state.loadCustomFile}
            busy={state.busy}
          />
        </StepSection>

        {/* Step 2: Import device signals */}
        {state.raw && (
          <StepSection
            stepNumber={2}
            title="Import Device Signals"
            description="Parse signals from CSV or AI-extracted data."
            collapsible
            collapsed={state.step2Collapsed}
            onCollapsedChange={state.setStep2Collapsed}
          >
            <SignalsInputSection
              template={state.selectedTemplate}
              csvInput={state.csvInput}
              onCsvInputChange={state.setCsvInput}
              onParseCSV={state.handleParseCSV}
              parseAndAddSignals={state.parseAndAddSignals}
              onCopyPrompt={state.handleCopyPrompt}
              onGenerateSignals={state.handleGenerateSignals}
              generateWithSignals={state.generateWithSignals}
              onClearSignals={state.handleClearSignals}
              deviceSignals={state.deviceSignals}
              inputWarnings={state.inputWarnings}
              busy={state.busy}
            />
          </StepSection>
        )}

        <ErrorDisplay error={state.error} />

        {/* Step 3: Results */}
        {state.raw && (
          <StepSection
            stepNumber={3}
            title="Generated Output"
            description={`Sheets: ${state.sheetNames.join(', ')}`}
          >
            <ResultsSection
              raw={state.raw}
              onExport={state.handleExport}
              onReset={state.handleResetRequest}
              busy={state.busy}
              pendingExport={state.pendingExport}
              templateId={state.selectedTemplateId}
              originalIbmaps={state.originalIbmaps}
            />
          </StepSection>
        )}
      </main>
    </div>
  );
}
