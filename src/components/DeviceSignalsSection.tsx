'use client';

import { useState, useEffect } from 'react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import type { Template } from '@/types/page.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploader } from './FileUploader';
import { SignalReviewPanel } from './SignalReviewPanel';
import { useAIParser } from '@/hooks/useAIParser';
import { Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';

type DeviceSignalsSectionProps = {
  template: Template;
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  onParseCSV: () => void;
  onCopyPrompt: () => void;
  onGenerateSignals: () => void;
  onClearSignals: () => void;
  deviceSignals: DeviceSignal[];
  parseWarnings: string[];
  busy: boolean;
};

export function DeviceSignalsSection({
  template,
  csvInput,
  onCsvInputChange,
  onParseCSV,
  onCopyPrompt,
  onGenerateSignals,
  onClearSignals,
  deviceSignals,
  parseWarnings,
  busy,
}: DeviceSignalsSectionProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const { state, parseFile, reset, acceptSignals, retry } = useAIParser();

  const isParsed = deviceSignals.length > 0;
  const canClear =
    isParsed || csvInput.trim().length > 0 || parseWarnings.length > 0;

  // Check for saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-parsed-signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < MAX_AGE) {
          setHasSavedData(true);
        } else {
          localStorage.removeItem('ai-parsed-signals');
        }
      } catch {
        localStorage.removeItem('ai-parsed-signals');
      }
    }
  }, []);

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    await parseFile(file, template.id);
  };

  // Handle accepting AI signals
  const handleAcceptSignals = () => {
    const signals = acceptSignals();
    if (signals) {
      // Convert to CSV format and set as input
      const csv = convertSignalsToCSV(signals);
      onCsvInputChange(csv);
      onParseCSV();
      reset();
      
      // Save to localStorage
      localStorage.setItem('ai-parsed-signals', JSON.stringify({
        signals,
        fileName: state.status === 'review' ? state.fileName : 'unknown',
        timestamp: Date.now(),
      }));
    }
  };

  // Handle loading saved signals
  const handleLoadSaved = () => {
    const saved = localStorage.getItem('ai-parsed-signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const csv = convertSignalsToCSV(parsed.signals);
        onCsvInputChange(csv);
        onParseCSV();
      } catch {
        localStorage.removeItem('ai-parsed-signals');
      }
    }
  };

  // Convert signals to CSV format
  const convertSignalsToCSV = (signals: DeviceSignal[]): string => {
    if (signals.length === 0) return '';
    
    // Get first signal to determine type
    const firstSignal = signals[0];
    
    if ('registerType' in firstSignal) {
      // Modbus
      const headers = 'deviceId,signalName,registerType,address,dataType,units,description,mode,factor';
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.deviceId},${sig.signalName},${sig.registerType},${sig.address},${sig.dataType},${sig.units || ''},${sig.description || ''},${sig.mode || ''},${sig.factor || ''}`;
      });
      return [headers, ...rows].join('\n');
    } else if ('objectType' in firstSignal) {
      // BACnet
      const headers = 'deviceId,signalName,objectType,instance,units,description';
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.deviceId},${sig.signalName},${sig.objectType},${sig.instance},${sig.units || ''},${sig.description || ''}`;
      });
      return [headers, ...rows].join('\n');
    } else if ('groupAddress' in firstSignal) {
      // KNX - already in format
      const headers = 'signalName,groupAddress,dpt,description';
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.signalName},${sig.groupAddress},${sig.dpt},${sig.description || ''}`;
      });
      return [headers, ...rows].join('\n');
    }
    
    return '';
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Input Device Signals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a device manual or paste CSV with signals.
        </p>
      </div>

      {/* Saved Data Indicator */}
      {hasSavedData && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              You have previously parsed signals saved
            </span>
          </div>
          <Button
            onClick={handleLoadSaved}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Load saved signals
          </Button>
        </div>
      )}

      {/* AI File Upload */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          🤖 AI-Powered File Upload
        </h3>
        
        {state.status === 'idle' && (
          <FileUploader
            onFileSelect={handleFileSelect}
            disabled={busy}
          />
        )}

        {state.status === 'uploading' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-blue-800">Uploading {state.file.name}...</p>
            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {state.status === 'parsing' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-blue-800">
              🤖 AI is analyzing {state.file.name}...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This may take 10-30 seconds depending on file size
            </p>
          </div>
        )}

        {state.status === 'review' && (
          <SignalReviewPanel
            signals={state.signals}
            warnings={state.warnings}
            fileName={state.fileName}
            onAccept={handleAcceptSignals}
            onRetry={() => {
              if (state.status === 'review') {
                // Find the file from localStorage or require re-upload
                reset();
              }
            }}
          />
        )}

        {state.status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800 font-medium">Error parsing file</p>
            <p className="text-xs text-red-600 mt-1">{state.error}</p>
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Manual CSV Input (Collapsible) */}
      <div className="rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between text-sm font-medium transition-colors"
        >
          <span>📝 Or paste CSV manually</span>
          {showManualInput ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showManualInput && (
          <div className="p-4 space-y-4">
            {/* Prompt per ChatGPT */}
            <details className="rounded-lg border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                🤖 AI Prompt Helper
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {template.promptText}
              </pre>
              <Button
                type="button"
                onClick={onCopyPrompt}
                variant="outline"
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

      {/* Warnings */}
      {parseWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-amber-600">
              {parseWarnings.length}
            </Badge>
            <span className="text-sm font-semibold text-amber-900">Warnings</span>
          </div>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-800">
            {parseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview signals */}
      {deviceSignals.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-emerald-600">
                ✓ PARSED
              </Badge>
              <span className="text-sm font-medium text-foreground">
                {deviceSignals.length} signals ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onGenerateSignals}
                disabled={busy}
                variant="primary-action"
                size="sm"
              >
                Generate Signals
              </Button>
              <Button
                onClick={onClearSignals}
                disabled={!canClear || busy}
                variant="neutral"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Device</th>
                  <th className="px-2 py-2">Signal</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Address/Instance</th>
                  <th className="px-2 py-2">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deviceSignals.slice(0, 20).map((sig, i) => (
                  <tr key={i} className="text-foreground">
                    <td className="px-2 py-2 font-mono text-xs">
                      {'deviceId' in sig ? sig.deviceId : '—'}
                    </td>
                    <td className="px-2 py-2">{sig.signalName}</td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {'objectType' in sig
                        ? sig.objectType
                        : 'registerType' in sig
                        ? sig.registerType
                        : 'dpt' in sig
                        ? sig.dpt
                        : '—'}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {'instance' in sig
                        ? sig.instance
                        : 'address' in sig
                        ? sig.address
                        : 'groupAddress' in sig
                        ? sig.groupAddress
                        : '—'}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {'units' in sig ? sig.units ?? '—' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deviceSignals.length > 20 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing first 20 of {deviceSignals.length} signals.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
