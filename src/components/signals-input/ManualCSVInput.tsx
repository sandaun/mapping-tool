import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Wand2 } from 'lucide-react';

interface ManualCSVInputProps {
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  onParseCSV: () => void;
  onCopyPrompt: () => void;
  promptText: string;
  busy: boolean;
}

export function ManualCSVInput({
  csvInput,
  onCsvInputChange,
  onParseCSV,
  onCopyPrompt,
  promptText,
  busy,
}: ManualCSVInputProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          Or paste CSV manually
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <details className="rounded-lg border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
              AI Prompt Helper
            </summary>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {promptText}
            </pre>
            <Button
              type="button"
              onClick={onCopyPrompt}
              variant="neutral"
              size="sm"
              className="mt-3 text-xs"
            >
              Copy Prompt
            </Button>
          </details>

          <textarea
            value={csvInput}
            onChange={(e) => onCsvInputChange(e.target.value)}
            placeholder="deviceId,signalName,registerType,address,dataType..."
            rows={8}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={onParseCSV}
              disabled={!csvInput.trim() || busy}
              variant="primary-action"
              size="sm"
            >
              Parse Signals
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
