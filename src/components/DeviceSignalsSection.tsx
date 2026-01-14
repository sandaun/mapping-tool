import type { DeviceSignal } from '@/lib/deviceSignals';
import type { Template } from '@/types/page.types';

type DeviceSignalsSectionProps = {
  template: Template;
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  onParseCSV: () => void;
  onCopyPrompt: () => void;
  onGenerateSignals: () => void;
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
  deviceSignals,
  parseWarnings,
  busy,
}: DeviceSignalsSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-base font-semibold">Import device signals</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Enganxa un CSV amb les senyals dels teus dispositius.
      </p>

      {/* Prompt per ChatGPT */}
      <details className="mt-4 rounded-lg border border-zinc-300 bg-zinc-50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700">
          📋 Prompt per ChatGPT (copia i enganxa)
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
          {template.promptText}
        </pre>
        <button
          type="button"
          onClick={onCopyPrompt}
          className="mt-3 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
        >
          Copia prompt
        </button>
      </details>

      {/* Textarea CSV */}
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            CSV (enganxa aquí el resultat de ChatGPT)
          </span>
          <textarea
            value={csvInput}
            onChange={(e) => onCsvInputChange(e.target.value)}
            placeholder="deviceId,signalName,..."
            rows={8}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono"
          />
        </label>

        <button
          type="button"
          onClick={onParseCSV}
          disabled={!csvInput.trim() || busy}
          className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Parse CSV
        </button>
      </div>

      {/* Warnings */}
      {parseWarnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-sm font-medium text-amber-900">
            Avisos ({parseWarnings.length})
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
            {parseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview signals */}
      {deviceSignals.length > 0 && (
        <div className="mt-4 rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Senyals parseades: {deviceSignals.length}
            </div>
            <button
              type="button"
              onClick={onGenerateSignals}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Generate Signals
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-300 text-xs uppercase text-zinc-600">
                <tr>
                  <th className="px-2 py-2">Device</th>
                  <th className="px-2 py-2">Signal</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Address/Instance</th>
                  <th className="px-2 py-2">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {deviceSignals.slice(0, 20).map((sig, i) => (
                  <tr key={i} className="text-zinc-700">
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
                    <td className="px-2 py-2 text-xs">{sig.units ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deviceSignals.length > 20 && (
              <p className="mt-2 text-xs text-zinc-500">
                Mostrant les primeres 20 de {deviceSignals.length} senyals.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
