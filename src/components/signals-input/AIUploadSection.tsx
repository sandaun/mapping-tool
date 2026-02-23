import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/FileUploader';
import { AISignalReviewPanel } from '@/components/AISignalReviewPanel';
import { Loader2, Sparkles, Library, RotateCcw } from 'lucide-react';
import type { AIParseStatus } from '@/hooks/useAIParser';

interface AIUploadSectionProps {
  aiState: AIParseStatus;
  inputType: string;
  isKNXFlow: boolean;
  analyzingProvider: string;
  busy: boolean;

  // Review panel props
  deviceCount: number;
  onDeviceCountChange: (count: number) => void;
  templateId: string;

  // Handlers
  onFileSelect: (file: File) => void;
  onAcceptSignals: () => void;
  onReset: () => void;
  onOpenLibrary: () => void;
}

export function AIUploadSection({
  aiState,
  inputType,
  analyzingProvider,
  busy,
  deviceCount,
  onDeviceCountChange,
  templateId,
  onFileSelect,
  onAcceptSignals,
  onReset,
  onOpenLibrary,
}: AIUploadSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-primary" />
        AI-Powered File Upload
        {inputType !== 'knx' && (
          <Button
            variant="neutral"
            size="sm"
            className="ml-auto text-xs"
            onClick={onOpenLibrary}
            disabled={busy}
          >
            <Library className="w-3.5 h-3.5 mr-1" />
            Load from Library
          </Button>
        )}
      </h3>

      {aiState.status === 'idle' && (
        <FileUploader onFileSelect={onFileSelect} disabled={busy} />
      )}

      {aiState.status === 'uploading' && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Uploading {aiState.file.name}...
          </p>
          <div className="mt-3 w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${aiState.progress}%` }}
            />
          </div>
        </div>
      )}

      {aiState.status === 'parsing' && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {analyzingProvider} is analyzing {aiState.file.name}...
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-1">
            This may take 10-30 seconds depending on file size
          </p>
        </div>
      )}

      {aiState.status === 'review' && (
        <AISignalReviewPanel
          signals={aiState.signals}
          aiWarnings={aiState.warnings}
          fileName={aiState.fileName}
          onAccept={onAcceptSignals}
          onRetry={onReset}
          deviceCount={deviceCount}
          onDeviceCountChange={onDeviceCountChange}
          templateId={templateId}
        />
      )}

      {aiState.status === 'error' && (
        <div className="rounded-lg border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-950/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Error parsing file
          </p>
          <p className="text-xs text-red-600 dark:text-red-400/70 mt-1">
            {aiState.error}
          </p>
          <Button
            onClick={onReset}
            variant="neutral"
            size="sm"
            className="mt-3 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
