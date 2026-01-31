import { useState } from 'react';
import { Check, AlertTriangle, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import type {
  DeviceSignal,
  ModbusSignal,
  BACnetSignal,
  KNXSignal,
} from '@/lib/deviceSignals';
import { ConfidenceBadge } from './ConfidenceBadge';

type SignalWithConfidence = DeviceSignal & { confidence: number };

interface SignalReviewPanelProps {
  signals: SignalWithConfidence[];
  warnings: string[];
  fileName: string;
  onAccept: () => void;
  onRetry: () => void;
  onEdit?: (index: number, signal: DeviceSignal) => void;
  onDelete?: (index: number) => void;
}

function isModbus(
  signal: DeviceSignal,
): signal is ModbusSignal & { confidence: number } {
  return 'registerType' in signal && 'address' in signal;
}

function isBACnet(
  signal: DeviceSignal,
): signal is BACnetSignal & { confidence: number } {
  return 'objectType' in signal && 'instance' in signal;
}

function isKNX(
  signal: DeviceSignal,
): signal is KNXSignal & { confidence: number } {
  return 'groupAddress' in signal && 'dpt' in signal;
}

export function SignalReviewPanel({
  signals,
  warnings,
  fileName,
  onAccept,
  onRetry,
  onEdit,
  onDelete,
}: SignalReviewPanelProps) {
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);

  const lowConfidenceCount = signals.filter((s) => s.confidence < 0.6).length;
  const mediumConfidenceCount = signals.filter(
    (s) => s.confidence >= 0.6 && s.confidence < 0.8,
  ).length;
  const highConfidenceCount = signals.filter((s) => s.confidence >= 0.8).length;

  const displayedSignals = showLowConfidenceOnly
    ? signals.filter((s) => s.confidence < 0.8)
    : signals;

  const getSignalDisplayFields = (signal: SignalWithConfidence) => {
    if (isModbus(signal)) {
      return {
        type: signal.registerType,
        address: signal.address,
        dataType: signal.dataType,
      };
    }
    if (isBACnet(signal)) {
      return {
        type: signal.objectType,
        address: signal.instance,
        dataType: '-',
      };
    }
    if (isKNX(signal)) {
      return {
        type: 'KNX',
        address: signal.groupAddress,
        dataType: signal.dpt,
      };
    }
    return { type: '-', address: '-', dataType: '-' };
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">📄 {fileName}</h3>
          <p className="text-sm text-gray-600">
            {signals.length} signals found
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            🟢 {highConfidenceCount} High
          </span>
          <span className="flex items-center gap-1">
            🟡 {mediumConfidenceCount} Medium
          </span>
          {lowConfidenceCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              🔴 {lowConfidenceCount} Low
            </span>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-sm text-yellow-800">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter toggle */}
      {(mediumConfidenceCount > 0 || lowConfidenceCount > 0) && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              showLowConfidenceOnly
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showLowConfidenceOnly
              ? 'Show All Signals'
              : `Review ${mediumConfidenceCount + lowConfidenceCount} Lower Confidence`}
          </button>
        </div>
      )}

      {/* Signals Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                #
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Signal Name
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Type
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Address
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Data
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Confidence
              </th>
              <th className="px-4 py-2 text-right font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayedSignals.map((signal) => {
              const fields = getSignalDisplayFields(signal);
              const originalIndex = signals.indexOf(signal);

              return (
                <tr
                  key={originalIndex}
                  className={
                    signal.confidence < 0.6 ? 'bg-red-50' : 'hover:bg-gray-50'
                  }
                >
                  <td className="px-4 py-2 text-gray-500">
                    {originalIndex + 1}
                  </td>
                  <td className="px-4 py-2 font-medium">{signal.signalName}</td>
                  <td className="px-4 py-2 text-gray-600">{fields.type}</td>
                  <td className="px-4 py-2 text-gray-600">{fields.address}</td>
                  <td className="px-4 py-2 text-gray-600">{fields.dataType}</td>
                  <td className="px-4 py-2">
                    <ConfidenceBadge
                      score={signal.confidence}
                      showScore
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => {
                            /* edit logic */
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(originalIndex)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {displayedSignals.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No signals to display
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>

        <div className="flex items-center gap-3">
          {lowConfidenceCount > 0 && (
            <p className="text-sm text-yellow-700">
              ⚠️ {lowConfidenceCount} signal(s) need review
            </p>
          )}
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <Check className="w-4 h-4" />
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
