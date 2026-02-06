'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractSignalsFromWorkbook } from '@/lib/overrides';
import { applyOverrides, applyOverridesToWorkbook } from '@/lib/overrides';
import { SignalsPreviewDialog } from '@/components/SignalsPreviewDialog';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { Override } from '@/types/overrides';
import type { IbmapsState } from '@/hooks/useFileImport';
import { workbookRowsToRawSignals } from '@/lib/ibmaps/reverseAdapters/bac-mbm';
import { workbookRowsToKnxRawSignals } from '@/lib/ibmaps/reverseAdapters/knx-mbm';
import { workbookRowsToBACKNXSignals } from '@/lib/ibmaps/reverseAdapters/bac-knx';
import { workbookRowsToMBSKNXSignals } from '@/lib/ibmaps/reverseAdapters/mbs-knx';
import { addModbusSignals_BAC_MBM } from '@/lib/ibmaps/generators/bac-mbm';
import { addModbusSignals_KNX_MBM } from '@/lib/ibmaps/generators/knx-mbm';
import { addKNXSignals_BAC_KNX } from '@/lib/ibmaps/generators/bac-knx';
import { addSignals_MBS_KNX } from '@/lib/ibmaps/generators/mbs-knx';
import { parseIbmapsSignals_BAC_MBM } from '@/lib/ibmaps/parsers/bac-mbm';
import { parseIbmapsSignals_KNX_MBM } from '@/lib/ibmaps/parsers/knx-mbm';
import { parseIbmapsSignals_BAC_KNX } from '@/lib/ibmaps/parsers/bac-knx';
import { parseIbmapsSignals_MBS_KNX } from '@/lib/ibmaps/parsers/mbs-knx';
import type { IbmapsDevice, RawSignal, KNXRawSignal, BACKNXRawSignal, MBSKNXRawSignal } from '@/lib/ibmaps/types';

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
      const workbookWithOverrides = applyOverridesToWorkbook(
        raw,
        overrides,
        templateId,
      );

      // Get Signals sheet
      const signalsSheet = workbookWithOverrides.sheets.find(
        (s) => s.name === 'Signals',
      );
      if (!signalsSheet) throw new Error('Signals sheet not found');

      // Calculate range for the newest rows at the bottom of the sheet
      const totalRows = signalsSheet.rows.length;
      const count = pendingExport.signalsCount;
      const startIdx = totalRows - count;

      if (startIdx < 0) throw new Error('Invalid row count calculation');

      // Find max device index for new device creation
      const maxDeviceIndex = originalIbmaps.devices.reduce(
        (max, d) => Math.max(max, d.index),
        -1,
      );
      const newDeviceIndex = maxDeviceIndex + 1;
      const newSlaveNum = 10 + newDeviceIndex;

      let newXml: string;

      // Route based on template type
      if (templateId === 'knx__modbus-master') {
        // KNX → Modbus Master flow
        const newSignals = workbookRowsToKnxRawSignals(
          signalsSheet,
          startIdx,
          count,
        );

        const baseSignals = parseIbmapsSignals_KNX_MBM(
          originalIbmaps.content,
        ).signals;
        const baseMaxId = baseSignals.reduce(
          (max, s) => Math.max(max, s.idxExternal),
          -1,
        );
        const normalizedSignals: KNXRawSignal[] = newSignals.map(
          (signal, index) => ({
            ...signal,
            idxExternal: baseMaxId + 1 + index,
          }),
        );

        // Check if we need to create a new device
        const newDevices: IbmapsDevice[] = [];
        const hasNewDevice = normalizedSignals.some(
          (s) => s.modbus.deviceIndex > maxDeviceIndex,
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

        newXml = addModbusSignals_KNX_MBM(
          originalIbmaps.content,
          normalizedSignals,
          newDevices,
        );
      } else if (templateId === 'bacnet-server__knx') {
        // BACnet Server → KNX flow
        const newSignals = workbookRowsToBACKNXSignals(
          signalsSheet,
          startIdx,
          count,
        );

        const baseSignals = parseIbmapsSignals_BAC_KNX(
          originalIbmaps.content,
        ).signals;
        const baseMaxId = baseSignals.reduce(
          (max, s) => Math.max(max, s.idxExternal),
          -1,
        );
        const normalizedSignals: BACKNXRawSignal[] = newSignals.map(
          (signal, index) => ({
            ...signal,
            idxExternal: baseMaxId + 1 + index,
          }),
        );

        newXml = addKNXSignals_BAC_KNX(
          originalIbmaps.content,
          normalizedSignals,
        );
      } else if (templateId === 'modbus-slave__knx') {
        // Modbus Slave → KNX flow
        const newSignals = workbookRowsToMBSKNXSignals(
          signalsSheet,
          startIdx,
          count,
        );

        const baseSignals = parseIbmapsSignals_MBS_KNX(
          originalIbmaps.content,
        ).signals;
        const baseMaxId = baseSignals.reduce(
          (max, s) => Math.max(max, s.idxExternal),
          -1,
        );
        const normalizedSignals: MBSKNXRawSignal[] = newSignals.map(
          (signal, index) => ({
            ...signal,
            idxExternal: baseMaxId + 1 + index,
          }),
        );

        newXml = addSignals_MBS_KNX(
          originalIbmaps.content,
          normalizedSignals,
        );
      } else {
        // BACnet → Modbus Master flow (default)
        const newSignals = workbookRowsToRawSignals(
          signalsSheet,
          startIdx,
          count,
        );

        const baseSignals = parseIbmapsSignals_BAC_MBM(
          originalIbmaps.content,
        ).signals;
        const baseMaxId = baseSignals.reduce(
          (max: number, s: RawSignal) => Math.max(max, s.idxExternal),
          -1,
        );
        const normalizedSignals: RawSignal[] = newSignals.map(
          (signal, index) => ({
            ...signal,
            idxExternal: baseMaxId + 1 + index,
          }),
        );

        // Check if we need to create a new device
        const newDevices: IbmapsDevice[] = [];
        const hasNewDevice = normalizedSignals.some(
          (s) => s.modbus.deviceIndex > maxDeviceIndex,
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

        newXml = addModbusSignals_BAC_MBM(
          originalIbmaps.content,
          normalizedSignals,
          newDevices,
        );
      }

      // Download file
      const blob = new Blob([newXml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Dynamic filename based on template
      const filenameMap: Record<string, string> = {
        'bacnet-server__modbus-master': 'IN-BAC-MBM-UPDATED.ibmaps',
        'knx__modbus-master': 'IN-KNX-MBM-UPDATED.ibmaps',
        'bacnet-server__knx': 'IN-BAC-KNX-UPDATED.ibmaps',
        'modbus-slave__knx': 'IN-MBS-KNX-UPDATED.ibmaps',
      };
      a.download = filenameMap[templateId] || 'UPDATED.ibmaps';
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
              variant="primary-action"
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
