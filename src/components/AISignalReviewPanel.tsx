'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CircleCheck,
  CircleMinus,
  CircleAlert,
  FileText,
  Copy,
} from 'lucide-react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import { EditableTable } from './EditableTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NumberStepper } from '@/components/ui/NumberStepper';
import type { EditableRow } from '@/types/overrides';

type SignalWithConfidence = DeviceSignal & { confidence: number };

interface AISignalReviewPanelProps {
  signals: SignalWithConfidence[];
  aiWarnings: string[];
  fileName: string;
  onAccept: () => void;
  onRetry: () => void;
  deviceCount: number;
  onDeviceCountChange: (count: number) => void;
  templateId: string;
}

const signalsToEditableRows = (
  signals: SignalWithConfidence[],
): EditableRow[] => {
  return signals.map((signal, index) => {
    let type = '-';
    let address: string | number = '-';
    let dataType = '-';

    if ('registerType' in signal) {
      type = signal.registerType;
      address = signal.address;
      dataType = signal.dataType;
    } else if ('objectType' in signal) {
      type = signal.objectType;
      address = signal.instance;
    } else if ('groupAddress' in signal) {
      type = 'KNX';
      address = signal.groupAddress;
      dataType = signal.dpt;
    }

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

export function AISignalReviewPanel({
  signals,
  aiWarnings,
  fileName,
  onAccept,
  onRetry,
  deviceCount,
  onDeviceCountChange,
  templateId,
}: AISignalReviewPanelProps) {
  const isKNXFlow = templateId.includes('knx');
  const lowConfidenceCount = signals.filter((s) => s.confidence < 0.6).length;
  const mediumConfidenceCount = signals.filter(
    (s) => s.confidence >= 0.6 && s.confidence < 0.8,
  ).length;
  const highConfidenceCount = signals.filter((s) => s.confidence >= 0.8).length;

  const tableData = useMemo(() => signalsToEditableRows(signals), [signals]);

  return (
    <div className="w-full space-y-4">
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

      {aiWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {aiWarnings.map((warning, i) => (
                <p
                  key={i}
                  className="text-sm text-amber-800 dark:text-amber-300"
                >
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-h-80 overflow-auto rounded-lg border border-border">
        <EditableTable
          data={tableData}
          renderCell={(columnKey, value, row) => {
            if (columnKey === 'Confidence') {
              const level = (row as Record<string, unknown>)
                ._confidenceLevel as string;
              const colorMap: Record<string, string> = {
                high: 'text-emerald-500',
                medium: 'text-amber-400',
                low: 'text-red-400',
              };
              return (
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${colorMap[level] ?? ''}`}
                  >
                    {String(value)}
                  </span>
                </div>
              );
            }
            return undefined;
          }}
        />
      </div>

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
          {!isKNXFlow && (
            <NumberStepper
              value={deviceCount}
              onChange={onDeviceCountChange}
              label="Devices"
              min={1}
              max={99}
            />
          )}
          <Button onClick={onAccept} variant="primary-action" size="sm">
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Accept & Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
