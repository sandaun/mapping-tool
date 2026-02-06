'use client';

import { useMemo } from 'react';
import { Check, AlertTriangle, RefreshCw, CircleCheck, CircleMinus, CircleAlert, FileText } from 'lucide-react';
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

    // Map confidence to colored HTML-safe label
    const confidenceLevel =
      signal.confidence >= 0.8
        ? 'high'
        : signal.confidence >= 0.6
          ? 'medium'
          : 'low';

    const confidenceLabels = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    return {
      id: `signal-${index}`,
      Name: signal.signalName,
      Type: type,
      Address: String(address),
      Data: dataType,
      Confidence: confidenceLabels[confidenceLevel],
      _confidenceLevel: confidenceLevel,
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
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-48">{fileName}</span>
            </div>
            <span className="text-border">|</span>
            <span className="text-sm font-semibold text-foreground">
              {signals.length} signals
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-500 border-emerald-200 dark:border-emerald-400/40 text-xs px-1.5 py-0.5 dark:bg-muted/30"
            >
              <CircleCheck className="w-3 h-3 mr-1" />
              {highConfidenceCount}
            </Badge>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-400 border-amber-200 dark:border-amber-400/40 dark:bg-muted/30 text-xs px-1.5 py-0.5"
            >
              <CircleMinus className="w-3 h-3 mr-1" />
              {mediumConfidenceCount}
            </Badge>
            {lowConfidenceCount > 0 && (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-400 border-red-200 dark:bg-muted/30 dark:border-red-400/40 text-xs px-1.5 py-0.5"
              >
                <CircleAlert className="w-3 h-3 mr-1" />
                {lowConfidenceCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-300">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signals Table - using EditableTable with colored confidence */}
      <div className="max-h-80 overflow-auto">
        <EditableTable
          data={tableData}
          renderCell={(columnKey, value, row) => {
            if (columnKey === 'Confidence') {
              const level = (row as Record<string, unknown>)._confidenceLevel as string;
              const colorMap: Record<string, string> = {
                high: 'text-emerald-500',
                medium: 'text-amber-400',
                low: 'text-red-400',
              };
              return (
                <span className={`font-medium ${colorMap[level] ?? ''}`}>
                  {String(value)}
                </span>
              );
            }
            return undefined;
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button onClick={onRetry} variant="neutral" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>

        <div className="flex items-center gap-3">
          {lowConfidenceCount > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowConfidenceCount} signal(s) may need review
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
