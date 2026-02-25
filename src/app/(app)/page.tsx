'use client';

import { useState } from 'react';
import { useOrchestrator } from '@/contexts/OrchestratorContext';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CollapsedProtocolLabel } from '@/components/ProtocolUI';
import { SignalsInputSection } from '@/components/signals-input';
import { ResultsSection } from '@/components/results-section';
import { ErrorDisplay } from '@/components/ErrorDisplay';

import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StepSection } from '@/components/ui/StepSection';

export default function Home() {
  const state = useOrchestrator();

  // Captured once at mount: if raw was already loaded (e.g. returning from
  // Settings), skip the entrance animation. Only animate on fresh load/login.
  const [shouldAnimate] = useState(() => !state.raw);
  return (
    <div className="bg-background pb-12">
      <LoadingOverlay visible={state.busy} message="Loading template..." />

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
        {/* Step 1 — always visible immediately */}
        <StepSection
          stepNumber={1}
          title="Gateway Templates"
          description="Select the template that matches your gateway"
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

        {/*
          Steps 2 & 3 — NOT in DOM until raw data is ready.
          When raw arrives (~150ms), the wrapper mounts with a CSS @keyframes
          animation (opacity 0→1 + translateY 12→0 over 500ms).
          Unlike CSS transitions, @keyframes animations fire on mount —
          the browser renders the first frame at opacity:0 then animates.
          This avoids any layout shift: nothing grows or collapses.
        */}
        {state.raw && (
          <div
            className={`flex flex-col gap-8${shouldAnimate ? ' animate-fadeIn' : ''}`}
          >
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

            <ErrorDisplay error={state.error} />

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
          </div>
        )}
      </main>
    </div>
  );
}
