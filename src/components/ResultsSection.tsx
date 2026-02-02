'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractSignalsFromWorkbook } from '@/lib/overrides';
import { applyOverrides } from '@/lib/overrides';
import { SignalsPreviewDialog } from '@/components/SignalsPreviewDialog';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { Override } from '@/types/overrides';
import type { IbmapsState } from '@/hooks/useFileImport';
import { workbookRowsToRawSignals } from '@/lib/ibmaps/reverseAdapter';
import { addModbusSignals_BAC_MBM } from '@/lib/ibmaps/generator';
import type { IbmapsDevice } from '@/lib/ibmaps/types';

type ResultsSectionProps = {
  raw: RawWorkbook;
  sheetNames: string[];
  onExport: (overrides: Override[]) => void;
  busy: boolean;
  pendingExport: { signalsCount: number; targetSheet: string } | null;
  templateId: string;
  originalIbmaps?: IbmapsState | null;
};

export function ResultsSection({
  raw,
  sheetNames,
  onExport,
  busy,
  pendingExport,
  templateId,
  originalIbmaps,
}: ResultsSectionProps) {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract signals from workbook
  const extractedSignals = useMemo(
    () => extractSignalsFromWorkbook(raw, templateId),
    [raw, templateId],
  );

  // Apply overrides to get displayed signals
  const displayedSignals = useMemo(
    () => applyOverrides(extractedSignals, overrides),
    [extractedSignals, overrides],
  );

  const handleDelete = (signalId: string) => {
    setOverrides((prev) => [...prev, { type: 'delete', signalId }]);
  };

  const handleReset = () => {
    setOverrides([]);
  };

  const handleExport = () => {
    onExport(overrides);
    setIsDialogOpen(false);
  };

  const handleExportIbmaps = () => {
    if (!originalIbmaps || !pendingExport) return;

    try {
      // Get Signals sheet
      const signalsSheet = raw.sheets.find((s) => s.name === 'Signals');
      if (!signalsSheet) throw new Error('Signals sheet not found');

      // Calculate range - skip metadata (6 rows) + header (1 row)
      const totalRows = signalsSheet.rows.length;
      const count = pendingExport.signalsCount;
      const startIdx = totalRows - count;

      if (startIdx < 0) throw new Error('Invalid row count calculation');

      // Convert rows to RawSignals using the reverse adapter
      const newSignals = workbookRowsToRawSignals(signalsSheet, startIdx, count);

      // Find max device index and create new device if needed
      const maxDeviceIndex = originalIbmaps.devices.reduce(
        (max, d) => Math.max(max, d.index),
        -1,
      );
      const newDeviceIndex = maxDeviceIndex + 1;
      const newSlaveNum = 10 + newDeviceIndex;

      // Check if we need to create a new device
      const newDevices: IbmapsDevice[] = [];
      const hasNewDevice = newSignals.some(
        (s) => s.modbus.deviceIndex > maxDeviceIndex
      );
      
      if (hasNewDevice) {
        newDevices.push({
          index: newDeviceIndex,
          name: `Device ${newDeviceIndex}`,
          slaveNum: newSlaveNum,
          baseRegister: 0,
          timeout: 1000,
          enabled: true,
        });
      }

      // Generate XML injecting the new signals
      const newXml = addModbusSignals_BAC_MBM(
        originalIbmaps.content,
        newSignals,
        newDevices,
      );

      // Download file
      const blob = new Blob([newXml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'IN-BAC-MBM-UPDATED.ibmaps';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('Error exporting IBMAPS (check console)');
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Generated Output</h2>
          <p className="text-sm text-muted-foreground">
            Sheets: {sheetNames.join(', ')}
          </p>
        </div>

        {pendingExport && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
            <p className="text-blue-700 dark:text-blue-300">
              {pendingExport.signalsCount} signals will be exported
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="neutral"
            disabled={busy}
            className="text-xs"
          >
            Preview & Edit Signals
          </Button>
          <Button
            onClick={handleExport}
            disabled={busy}
            variant="secondary-action"
            className="text-xs"
          >
            {busy ? 'Exporting...' : 'Export Template'}
          </Button>
          {originalIbmaps && (
            <Button
              onClick={handleExportIbmaps}
              disabled={busy || !pendingExport}
              variant="default"
              className="text-xs"
            >
              Export IBMAPS
            </Button>
          )}
        </div>
      </div>

      <SignalsPreviewDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        signals={displayedSignals}
        overrides={overrides}
        onDelete={handleDelete}
        onReset={handleReset}
        onExport={handleExport}
      />
    </section>
  );
}
