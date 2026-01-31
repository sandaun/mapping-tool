'use client';

import { useMemo } from 'react';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import { EditableTable } from './EditableTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EditableRow } from '@/types/overrides';

type SignalWithConfidence = DeviceSignal & { confidence: number };

interface SignalReviewPanelProps {
  signals: SignalWithConfidence[];
  warnings: string[];
  fileName: string;
  onAccept: () => void;
  onRetry: () => void;
}

/**
 * Convert AI-parsed signals to EditableRow format for the table
 */
const signalsToEditableRows = (
  signals: SignalWithConfidence[],
): EditableRow[] => {
  return signals.map((signal, index) => {
    // Determine type and address based on signal type
    let type = '-';
    let address: string | number = '-';
    let dataType = '-';

    if ('registerType' in signal) {
      // Modbus
      type = signal.registerType;
      address = signal.address;
      dataType = signal.dataType;
    } else if ('objectType' in signal) {
      // BACnet
      type = signal.objectType;
      address = signal.instance;
    } else if ('groupAddress' in signal) {
      // KNX
      type = 'KNX';
      address = signal.groupAddress;
      dataType = signal.dpt;
    }

    // Map confidence to visual indicator
    const confidenceLabel =
      signal.confidence >= 0.8
        ? '🟢 High'
        : signal.confidence >= 0.6
          ? '🟡 Medium'
          : '🔴 Low';

    return {
      id: `signal-${index}`,
      Name: signal.signalName,
      Type: type,
      Address: String(address),
      Data: dataType,
      Confidence: confidenceLabel,
    };
  });
};

export function SignalReviewPanel({
  signals,
  warnings,
  fileName,
  onAccept,
  onRetry,
}: SignalReviewPanelProps) {
  const lowConfidenceCount = signals.filter((s) => s.confidence < 0.6).length;
  const mediumConfidenceCount = signals.filter(
    (s) => s.confidence >= 0.6 && s.confidence < 0.8,
  ).length;
  const highConfidenceCount = signals.filter((s) => s.confidence >= 0.8).length;

  // Convert signals to table format
  const tableData = useMemo(() => signalsToEditableRows(signals), [signals]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">📄 {fileName}</h3>
          <p className="text-sm text-muted-foreground">
            {signals.length} signals found
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            🟢 {highConfidenceCount}
          </Badge>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            🟡 {mediumConfidenceCount}
          </Badge>
          {lowConfidenceCount > 0 && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              🔴 {lowConfidenceCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-sm text-amber-800">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signals Table - using EditableTable for consistency */}
      <div className="max-h-80 overflow-auto">
        <EditableTable data={tableData} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button onClick={onRetry} variant="neutral" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>

        <div className="flex items-center gap-3">
          {lowConfidenceCount > 0 && (
            <p className="text-sm text-amber-700">
              ⚠️ {lowConfidenceCount} signal(s) may need review
            </p>
          )}
          <Button onClick={onAccept} variant="primary-action" size="sm">
            <Check className="w-4 h-4 mr-2" />
            Accept & Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
