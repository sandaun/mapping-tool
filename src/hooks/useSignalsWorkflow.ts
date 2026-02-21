import { useState } from 'react';
import {
  parseDeviceSignalsCSV,
  detectSignalProtocol,
  getProtocolLabel,
  type DeviceSignal,
} from '@/lib/deviceSignals';
import { TEMPLATE_INPUT_TYPE } from '@/lib/ai-providers';
import type { TemplateId } from '@/types/page.types';
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
  const [inputWarnings, setInputWarnings] = useState<string[]>([]);
  const [pendingExport, setPendingExport] = useState<PendingExport>(null);

  /**
   * Parse CSV and add signals to current list
   * Pure function that doesn't depend on state
   */
  const parseAndAddSignals = (csv: string) => {
    setInputWarnings([]);

    if (!csv.trim()) {
      setInputWarnings(['CSV is empty or contains only headers.']);
      return;
    }

    // Detect protocol mismatch before parsing
    const detected = detectSignalProtocol(csv);
    const expectedType = TEMPLATE_INPUT_TYPE[template.id as TemplateId];
    const mismatchWarnings: string[] = [];

    if (detected !== 'unknown' && expectedType && detected !== expectedType) {
      mismatchWarnings.push(
        `Protocol mismatch: the signals appear to be ${getProtocolLabel(detected)} format, but the selected template expects ${getProtocolLabel(expectedType)} signals. Please verify you're using the correct template or signal format.`,
      );
    }

    const result = parseDeviceSignalsCSV(csv, template.id);
    setDeviceSignals((prev) => [...prev, ...result.signals]);
    setInputWarnings([...mismatchWarnings, ...result.warnings]);
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
    setInputWarnings([]);
    setCsvInput('');
  };

  /**
   * Generate signals and update workbook (uses current deviceSignals state)
   */
  const handleGenerateSignals = (deviceCount: number = 1) => {
    if (deviceSignals.length === 0) return;
    generateWithSignals(deviceSignals, deviceCount);

    // Clear after generating (already done in generateWithSignals? No, it doesn't clear)
    setCsvInput('');
    setDeviceSignals([]);
  };

  /**
   * Dispatch signal generation to the correct action based on gateway type.
   * Pure helper — does NOT mutate state.
   */
  const dispatchGeneration = (
    signals: DeviceSignal[],
    workbook: RawWorkbook,
  ) => {
    if (template.id === 'bacnet-server__modbus-master') {
      return generateBACnetFromModbus(signals, workbook, 'simple');
    } else if (template.id === 'modbus-slave__bacnet-client') {
      return generateModbusFromBACnet(signals, workbook, 'simple');
    } else if (template.id === 'knx__modbus-master') {
      return generateKNXFromModbus(signals, workbook);
    } else if (template.id === 'knx__bacnet-client') {
      return generateKNXFromBACnet(signals, workbook);
    } else if (template.id === 'modbus-slave__knx') {
      return generateModbusFromKNX(signals, workbook);
    } else if (template.id === 'bacnet-server__knx') {
      return generateBACnetServerFromKNX(signals, workbook);
    }
    throw new Error(`Gateway type not implemented yet: ${template.id}`);
  };

  /**
   * Generate signals directly with provided signals (bypasses deviceSignals state).
   * When deviceCount > 1, iterates N times — each pass reads the updated workbook
   * so IDs, instances, and device numbers auto-increment correctly.
   */
  const generateWithSignals = (
    signals: DeviceSignal[],
    deviceCount: number = 1,
  ) => {
    if (!raw || signals.length === 0) return;

    try {
      let currentWorkbook = raw;
      let totalRowsAdded = 0;
      const allWarnings: string[] = [];

      for (let i = 0; i < deviceCount; i++) {
        const result = dispatchGeneration(signals, currentWorkbook);
        currentWorkbook = result.updatedWorkbook;
        totalRowsAdded += result.rowsAdded;
        allWarnings.push(...result.warnings);
      }

      setRaw(currentWorkbook);

      if (allWarnings.length > 0) {
        setInputWarnings((prev) => [...prev, ...allWarnings]);
      }

      // Determinar target sheet segons template
      const targetSheet = template.id.includes('bacnet-server')
        ? 'BACnet Server'
        : template.id.includes('modbus')
          ? 'Modbus Master'
          : 'KNX';

      // Mostrar badge persistent
      setPendingExport((prev) => ({
        signalsCount: (prev?.signalsCount ?? 0) + totalRowsAdded,
        targetSheet,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setInputWarnings((prev) => [...prev, message]);
    }
  };

  const resetPendingExport = () => {
    setPendingExport(null);
  };

  return {
    // State
    csvInput,
    deviceSignals,
    inputWarnings,
    pendingExport,
    // Actions
    setCsvInput,
    parseAndAddSignals,
    handleParseCSV,
    handleClearSignals,
    handleGenerateSignals,
    generateWithSignals,
    resetPendingExport,
  };
};
