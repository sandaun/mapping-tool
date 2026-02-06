import { useState, useRef, useCallback } from 'react';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { ImportResponse, ProtocolsMetadata } from '@/types/page.types';
import { parseIbmapsSignals_BAC_MBM } from '@/lib/ibmaps/parsers/bac-mbm';
import { rawSignalsToWorkbook } from '@/lib/ibmaps/adapters/bac-mbm';
import { parseIbmapsSignals_KNX_MBM } from '@/lib/ibmaps/parsers/knx-mbm';
import { rawKNXSignalsToWorkbook } from '@/lib/ibmaps/adapters/knx-mbm';
import { parseIbmapsSignals_BAC_KNX } from '@/lib/ibmaps/parsers/bac-knx';
import { rawBACKNXSignalsToWorkbook } from '@/lib/ibmaps/adapters/bac-knx';
import { parseIbmapsSignals_MBS_KNX } from '@/lib/ibmaps/parsers/mbs-knx';
import { rawMBSKNXSignalsToWorkbook } from '@/lib/ibmaps/adapters/mbs-knx';
import { parseIbmapsSignals_KNX_BAC } from '@/lib/ibmaps/parsers/knx-bac';
import { rawKNXBACSignalsToWorkbook } from '@/lib/ibmaps/adapters/knx-bac';
import { parseIbmapsSignals_MBS_BAC } from '@/lib/ibmaps/parsers/mbs-bac';
import { rawMBSBACSignalsToWorkbook } from '@/lib/ibmaps/adapters/mbs-bac';
import type { IbmapsDevice } from '@/lib/ibmaps/types';

// Type guards
function isErrorResponse(data: unknown): data is { error: unknown } {
  return typeof data === 'object' && data !== null && 'error' in data;
}

function isImportResponse(data: unknown): data is ImportResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'raw' in data &&
    'protocols' in data
  );
}

/**
 * State for preserving original ibmaps data for later export
 */
export type IbmapsState = {
  content: string;
  devices: IbmapsDevice[];
};

export function useFileImport() {
  const [raw, setRaw] = useState<RawWorkbook | null>(null);
  const [protocols, setProtocols] = useState<ProtocolsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [originalIbmaps, setOriginalIbmaps] = useState<IbmapsState | null>(
    null,
  );

  // Delayed busy: avoids visual blink on fast loads
  const busyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const BUSY_DELAY_MS = 150;

  const startBusy = useCallback(() => {
    busyTimerRef.current = setTimeout(() => setBusy(true), BUSY_DELAY_MS);
  }, []);

  const stopBusy = useCallback(() => {
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
      busyTimerRef.current = null;
    }
    setBusy(false);
  }, []);

  async function importArrayBufferAsFile(
    arrayBuffer: ArrayBuffer,
    filename: string,
    expectedSheets?: readonly string[],
    baseXlsxHref?: string,
  ) {
    setError(null);
    startBusy();

    const importXlsxArrayBuffer = async (
      buffer: ArrayBuffer,
      fileName: string,
      expected?: readonly string[],
    ): Promise<ImportResponse> => {
      const file = new File([buffer], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = new FormData();
      formData.set('file', file);

      if (expected) {
        formData.set('expectedSheets', JSON.stringify(expected));
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        const message = isErrorResponse(data)
          ? String(data.error)
          : 'Error important.';
        throw new Error(message);
      }

      if (!isImportResponse(data)) {
        throw new Error('Resposta invàlida del servidor.');
      }

      return data;
    };

    try {
      // Check for .ibmaps extension - parse client-side
      if (filename.toLowerCase().endsWith('.ibmaps')) {
        const textDecoder = new TextDecoder('utf-8');
        const xmlContent = textDecoder.decode(arrayBuffer);

        // Detect protocol from XML
        const internalProtocolMatch = xmlContent.match(
          /InternalProtocol="([^"]+)"/,
        );
        const externalProtocolMatch = xmlContent.match(
          /ExternalProtocol="([^"]+)"/,
        );
        const internalProtocol = internalProtocolMatch?.[1] || 'BACnet Server';
        const externalProtocol = externalProtocolMatch?.[1] || 'Modbus Master';

        let workbook: RawWorkbook;
        let devices: IbmapsDevice[];

        // Route to appropriate parser based on protocol combination
        if (internalProtocol === 'KNX' && externalProtocol === 'Modbus Master') {
          const parseResult = parseIbmapsSignals_KNX_MBM(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (KNX-MBM):', parseResult.warnings);
          }
          workbook = rawKNXSignalsToWorkbook(parseResult.signals, parseResult.devices);
          devices = parseResult.devices;
        } else if (internalProtocol === 'BACnet Server' && externalProtocol === 'KNX') {
          const parseResult = parseIbmapsSignals_BAC_KNX(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (BAC-KNX):', parseResult.warnings);
          }
          workbook = rawBACKNXSignalsToWorkbook(parseResult.signals);
          devices = []; // BAC-KNX doesn't have Modbus devices
        } else if (internalProtocol === 'Modbus Slave' && externalProtocol === 'KNX') {
          const parseResult = parseIbmapsSignals_MBS_KNX(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (MBS-KNX):', parseResult.warnings);
          }
          workbook = rawMBSKNXSignalsToWorkbook(parseResult.signals);
          devices = []; // MBS-KNX doesn't have Modbus devices
        } else if (internalProtocol === 'KNX' && externalProtocol === 'BACnet Client') {
          const parseResult = parseIbmapsSignals_KNX_BAC(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (KNX-BAC):', parseResult.warnings);
          }
          workbook = rawKNXBACSignalsToWorkbook(parseResult.signals);
          devices = []; // KNX-BAC doesn't have Modbus devices
        } else if (internalProtocol === 'Modbus Slave' && externalProtocol === 'BACnet Client') {
          const parseResult = parseIbmapsSignals_MBS_BAC(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (MBS-BAC):', parseResult.warnings);
          }
          workbook = rawMBSBACSignalsToWorkbook(parseResult.signals);
          devices = []; // MBS-BAC doesn't have Modbus devices
        } else {
          // Default to BACnet-Modbus
          const parseResult = parseIbmapsSignals_BAC_MBM(xmlContent);
          if (parseResult.warnings.length > 0) {
            console.warn('IBMAPS Parse Warnings (BAC-MBM):', parseResult.warnings);
          }
          workbook = rawSignalsToWorkbook(parseResult.signals, parseResult.devices);
          devices = parseResult.devices;
        }

        let mergedWorkbook = workbook;
        let baseProtocols: ProtocolsMetadata | null = null;

        if (baseXlsxHref) {
          const res = await fetch(baseXlsxHref);
          if (!res.ok) {
            throw new Error('Could not load base XLSX template.');
          }

          const baseBuffer = await res.arrayBuffer();
          const baseImport = await importXlsxArrayBuffer(
            baseBuffer,
            baseXlsxHref.split('/').pop() || 'template.xlsx',
            expectedSheets,
          );

          baseProtocols = baseImport.protocols;

          const baseSheet = baseImport.raw.sheets.find(
            (sheet) => sheet.name === 'Signals',
          );
          const ibmapsSheet = workbook.sheets.find(
            (sheet) => sheet.name === 'Signals',
          );

          if (!baseSheet || !ibmapsSheet) {
            throw new Error('Signals sheet not found.');
          }

          const basePrefix = baseSheet.rows.slice(0, 6);
          const baseDataRows = baseSheet.rows.slice(6);
          const ibmapsDataRows = ibmapsSheet.rows.slice(7);
          const extraRows = ibmapsDataRows.slice(baseDataRows.length);
          const updatedSignalsSheet = {
            ...baseSheet,
            rows: [...basePrefix, ...baseDataRows, ...extraRows],
          };

          mergedWorkbook = {
            sheets: baseImport.raw.sheets.map((sheet) =>
              sheet.name === 'Signals' ? updatedSignalsSheet : sheet,
            ),
          };
        }

        setRaw(mergedWorkbook);
        setProtocols(
          baseProtocols ?? {
            internalProtocol,
            externalProtocol,
          },
        );
        setOriginalIbmaps({
          content: xmlContent,
          devices,
        });

        return; // Skip server call for ibmaps
      }

      // Standard xlsx import via API
      const data = await importXlsxArrayBuffer(
        arrayBuffer,
        filename,
        expectedSheets,
      );

      setRaw(data.raw);
      setProtocols(data.protocols);
      setOriginalIbmaps(null); // Not an ibmaps file
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      stopBusy();
    }
  }

  async function exportWorkbook() {
    if (!raw) return;
    startBusy();
    setError(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raw),
      });

      if (!res.ok) {
        const data: unknown = await res.json();
        const message = isErrorResponse(data)
          ? String(data.error)
          : 'Error exportant.';
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      stopBusy();
    }
  }

  return {
    raw,
    setRaw,
    protocols,
    error,
    busy,
    importArrayBufferAsFile,
    exportWorkbook,
    originalIbmaps,
  };
}
