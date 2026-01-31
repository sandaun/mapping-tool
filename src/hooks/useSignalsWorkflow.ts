import { useState } from 'react';
import { parseDeviceSignalsCSV, type DeviceSignal } from '@/lib/deviceSignals';
import { generateBACnetFromModbus } from '@/lib/actions/generateBACnetFromModbus';
import { generateModbusFromBACnet } from '@/lib/actions/generateModbusFromBACnet';
import { generateKNXFromModbus } from '@/lib/actions/generateKNXFromModbus';
import { generateKNXFromBACnet } from '@/lib/actions/generateKNXFromBACnet';
import { generateBACnetServerFromKNX } from '@/lib/actions/generateBACnetServerFromKNX';
import { generateModbusFromKNX } from '@/lib/actions/generateModbusFromKNX';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { Template } from '@/types/page.types';

type PendingExport = {
  signalsCount: number;
  targetSheet: string;
} | null;

/**
 * Hook to manage signals workflow: parse, generate, clear
 * Encapsulates all signal-related business logic
 */
export const useSignalsWorkflow = (
  template: Template,
  raw: RawWorkbook | null,
  setRaw: (workbook: RawWorkbook) => void,
) => {
  const [csvInput, setCsvInput] = useState('');
  const [deviceSignals, setDeviceSignals] = useState<DeviceSignal[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [pendingExport, setPendingExport] = useState<PendingExport>(null);

  /**
   * Parse CSV and add signals to current list
   * Pure function that doesn't depend on state
   */
  const parseAndAddSignals = (csv: string) => {
    setParseWarnings([]);

    if (!csv.trim()) {
      setParseWarnings(['El CSV està buit.']);
      return;
    }

    const result = parseDeviceSignalsCSV(csv, template.id);
    setDeviceSignals((prev) => [...prev, ...result.signals]);
    setParseWarnings(result.warnings);
  };

  /**
   * Parse CSV from textarea input
   */
  const handleParseCSV = () => {
    parseAndAddSignals(csvInput);
  };

  /**
   * Clear all signals and reset state
   */
  const handleClearSignals = () => {
    setDeviceSignals([]);
    setParseWarnings([]);
    setCsvInput('');
  };

  /**
   * Generate signals and update workbook
   */
  const handleGenerateSignals = () => {
    if (!raw || deviceSignals.length === 0) return;

    try {
      let result;

      // Dispatch to correct action based on gateway type
      if (template.id === 'bacnet-server__modbus-master') {
        result = generateBACnetFromModbus(deviceSignals, raw, 'simple');
      } else if (template.id === 'modbus-slave__bacnet-client') {
        result = generateModbusFromBACnet(deviceSignals, raw, 'simple');
      } else if (template.id === 'knx__modbus-master') {
        result = generateKNXFromModbus(deviceSignals, raw);
      } else if (template.id === 'knx__bacnet-client') {
        result = generateKNXFromBACnet(deviceSignals, raw);
      } else if (template.id === 'modbus-slave__knx') {
        result = generateModbusFromKNX(deviceSignals, raw);
      } else if (template.id === 'bacnet-server__knx') {
        result = generateBACnetServerFromKNX(deviceSignals, raw);
      } else {
        throw new Error(`Gateway type not implemented yet: ${template.id}`);
      }

      setRaw(result.updatedWorkbook);

      if (result.warnings.length > 0) {
        setParseWarnings((prev) => [...prev, ...result.warnings]);
      }

      // Determinar target sheet segons template
      const targetSheet = template.id.includes('bacnet-server')
        ? 'BACnet Server'
        : template.id.includes('modbus')
          ? 'Modbus Master'
          : 'KNX';

      // Mostrar badge persistent
      setPendingExport((prev) => ({
        signalsCount: (prev?.signalsCount ?? 0) + result.rowsAdded,
        targetSheet,
      }));

      // Clear CSV input i signals després de generar
      setCsvInput('');
      setDeviceSignals([]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setParseWarnings((prev) => [...prev, message]);
    }
  };

  const resetPendingExport = () => {
    setPendingExport(null);
  };

  return {
    // State
    csvInput,
    deviceSignals,
    parseWarnings,
    pendingExport,
    // Actions
    setCsvInput,
    parseAndAddSignals,
    handleParseCSV,
    handleClearSignals,
    handleGenerateSignals,
    resetPendingExport,
  };
};
