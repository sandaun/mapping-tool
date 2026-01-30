import type { DeviceSignal } from '@/lib/deviceSignals';
import type { Template } from '@/types/page.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const isParsed = deviceSignals.length > 0;
  const canClear =
    isParsed || csvInput.trim().length > 0 || parseWarnings.length > 0;

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Input Device Signals</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a CSV with signals from your devices.
      </p>

      {/* Prompt per ChatGPT */}
      <details className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          🤖 AI Prompt Helper
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
          {template.promptText}
        </pre>
        <Button
          type="button"
          onClick={onCopyPrompt}
          variant="neutral"
          className="mt-3 text-xs"
        >
          Copy Prompt
        </Button>
      </details>

      {/* Textarea CSV */}
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            CSV (paste ChatGPT output here)
          </span>
          <textarea
            value={csvInput}
            onChange={(e) => onCsvInputChange(e.target.value)}
            placeholder="deviceId,signalName,..."
            rows={8}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex items-center justify-between">
          <div />

          {/* Botons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onParseCSV}
              disabled={!csvInput.trim() || busy}
              variant="primary-action"
              className="text-xs"
            >
              Parse Signals
            </Button>
            <Button
              type="button"
              onClick={onGenerateSignals}
              disabled={!isParsed || busy}
              variant="secondary-action"
              className="text-xs"
            >
              Generate Signals
            </Button>
            <Button
              type="button"
              onClick={onClearSignals}
              disabled={!canClear || busy}
              variant="neutral"
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {parseWarnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-amber-600">
              {parseWarnings.length}
            </Badge>
            <span className="text-sm font-semibold text-amber-900">
              Warnings
            </span>
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
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-emerald-600">
              ✓ PARSED
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {deviceSignals.length} signals ready
            </span>
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
