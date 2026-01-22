import type { RawWorkbook } from '../excel/raw';
import type { DeviceSignal } from '../deviceSignals';
import type { GenerateSignalsResult, AllocationPolicy } from '@/types/actions';
import { WARNINGS, EXCEL_VALUES, DEVICE_TEMPLATES } from '@/constants/generation';
import { detectUnitFromSignalName } from '../../constants/bacnetUnits';
import { getLastDeviceNumber } from './utils/device';
import { formatBACnetType } from './utils/bacnet';
import { getModbusFunctions, getModbusFormat } from './utils/modbus';
import { allocateBACnetInstances } from './utils/allocation';
import { mapModbusToBACnetObjectType } from './utils/mapping';
import { createSheetContext, findSignalsSheet } from './utils/common';
import { filterModbusSignals } from './utils/signal-filtering';
import {
  getReadWriteCapabilities,
  getBACnetReadWriteCapabilities,
} from './utils/read-write';

/**
 * Generate BACnet signals from Modbus device signals.
 * Gateway: BACnet Server ← Modbus Master
 */
export function generateBACnetFromModbus(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = 'simple'
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Find Signals sheet
  const signalsSheet = findSignalsSheet(rawWorkbook);
  if (!signalsSheet) {
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Create sheet context with helpers
  const ctx = createSheetContext(signalsSheet);
  const { findCol, getMaxNumericInColumn, createEmptyRow, headers } = ctx;

  // Get the next # value (sequential ID)
  let nextId = ctx.getNextId();

  // Detect last device number to auto-increment
  const lastDeviceNum = getLastDeviceNumber(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;
  const newSlaveId = 10 + newDeviceNum; // Slave ID = 10 + device number

  // Filter Modbus signals (type-safe, NO 'as')
  const modbusSignals = filterModbusSignals(deviceSignals);

  // Device signals = Modbus → Generate BACnet columns
  const instanceAllocation = allocateBACnetInstances(modbusSignals, policy);
  const lastInstance = getMaxNumericInColumn('Instance');
  const baseInstance = lastInstance >= 0 ? lastInstance : 0;

  for (const modbusSignal of modbusSignals) {
    const signalId = `${modbusSignal.deviceId}_${modbusSignal.signalName}`;

    const objectType = mapModbusToBACnetObjectType(
      modbusSignal.dataType,
      modbusSignal.registerType
    );
    const instance = (instanceAllocation.get(signalId) ?? 1) + baseInstance;

    // Determine if signal is readable/writable
    // Use mode if available, otherwise fallback to BACnet object type heuristics
    const { isReadable, isWritable } = getReadWriteCapabilities(
      modbusSignal,
      () => getBACnetReadWriteCapabilities(objectType)
    );

    const modbusFunctions = getModbusFunctions(
      modbusSignal.registerType,
      isReadable,
      isWritable
    );

    // Build row with all required columns
    const row = createEmptyRow();

    // BACnet columns
    row[findCol('#')] = nextId++;
    row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
    row[findCol('Description')] = '';
    row[findCol('Name')] = modbusSignal.signalName;
    row[findCol('Type')] = formatBACnetType(objectType);
    row[findCol('Instance')] = instance;

    // Auto-detect units from signal name, fallback to defaults
    let unitCode: number | string;
    if (objectType.startsWith('B')) {
      unitCode = '-1'; // Binary: always -1
    } else if (objectType.startsWith('M')) {
      unitCode = '-1'; // Multistate: always -1
    } else {
      // Analog: try to detect from signal name
      unitCode = detectUnitFromSignalName(modbusSignal.signalName);
    }
    row[findCol('Units')] = unitCode;

    row[findCol('NC')] = EXCEL_VALUES.EMPTY;
    row[findCol('Texts')] = EXCEL_VALUES.EMPTY;
    row[findCol('# States')] = objectType.startsWith('B')
      ? '2'
      : objectType.startsWith('M')
      ? '65535'
      : EXCEL_VALUES.EMPTY;
    row[findCol('Rel. Def.')] = EXCEL_VALUES.EMPTY;
    row[findCol('COV')] = objectType.startsWith('A') ? EXCEL_VALUES.DEFAULT_DEADBAND : EXCEL_VALUES.EMPTY; // Analog values: 0, Binary/Multistate: -

    // Modbus columns (second #)
    const modbusIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('COV')
    );
    if (modbusIdCol >= 0) row[modbusIdCol] = nextId - 1;
    row[findCol('Device')] = DEVICE_TEMPLATES.RTU_PORT_A(newDeviceNum);
    row[findCol('# Slave')] = newSlaveId;
    row[findCol('Base')] = EXCEL_VALUES.BASE_ZERO;
    row[findCol('Read Func')] = modbusFunctions.read;
    row[findCol('Write Func')] = modbusFunctions.write;
    const format =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? EXCEL_VALUES.EMPTY
        : getModbusFormat(modbusSignal.dataType);
    let dataLengthValue = '16';
    if (
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
    ) {
      dataLengthValue = '1';
    } else if (format === '3: Float' || /32/.test(modbusSignal.dataType)) {
      dataLengthValue = '32';
    }
    row[findCol('Data Length')] = dataLengthValue;
    row[findCol('Format')] = format;
    row[findCol('ByteOrder')] =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? EXCEL_VALUES.EMPTY
        : EXCEL_VALUES.BYTE_ORDER_BIG_ENDIAN;
    row[findCol('Address')] = modbusSignal.address;
    row[findCol('Bit')] = EXCEL_VALUES.EMPTY;
    row[findCol('# Bits')] = EXCEL_VALUES.EMPTY;
    row[findCol('Deadband')] = EXCEL_VALUES.DEFAULT_DEADBAND;
    row[findCol('Conv. Id')] = '';
    row[findCol('Conversions')] = EXCEL_VALUES.EMPTY;

    signalsSheet.rows.push(row);
    rowsAdded++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
