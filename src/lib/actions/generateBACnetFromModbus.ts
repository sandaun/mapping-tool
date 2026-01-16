import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, ModbusSignal } from '../deviceSignals';
import { detectUnitFromSignalName } from '../../constants/bacnetUnits';
import { findHeaderRowIndex } from './utils/headers';
import { getLastDeviceNumber } from './utils/device';
import { formatBACnetType } from './utils/bacnet';
import { getModbusFunctions, getModbusFormat } from './utils/modbus';
import {
  allocateBACnetInstances,
  type AllocationPolicy,
} from './utils/allocation';
import { mapModbusToBACnetObjectType } from './utils/mapping';

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

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
  const signalsSheet = rawWorkbook.sheets.find((s) => s.name === 'Signals');
  if (!signalsSheet) {
    warnings.push("No s'ha trobat el sheet 'Signals'.");
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Find where the actual headers are
  const headerRowIdx = findHeaderRowIndex(signalsSheet);
  const headers =
    headerRowIdx >= 0 ? signalsSheet.rows[headerRowIdx] : signalsSheet.headers;

  // Helper to find column index by exact name
  const findCol = (name: string): number => {
    const idx = headers.findIndex((h) => h === name);
    return idx;
  };

  const getMaxNumericInColumn = (colName: string): number => {
    const colIdx = findCol(colName);
    if (colIdx < 0) return -1;

    let max = -1;
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    for (let i = startRow; i < signalsSheet.rows.length; i++) {
      const cell = signalsSheet.rows[i][colIdx];
      const value =
        typeof cell === 'number'
          ? cell
          : typeof cell === 'string'
          ? Number(cell)
          : NaN;
      if (!Number.isNaN(value)) {
        max = Math.max(max, value);
      }
    }
    return max;
  };

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Detect last device number to auto-increment
  const lastDeviceNum = getLastDeviceNumber(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;
  const newSlaveId = 10 + newDeviceNum; // Slave ID = 10 + device number

  // Device signals = Modbus → Generate BACnet columns
  const instanceAllocation = allocateBACnetInstances(deviceSignals, policy);
  const lastInstance = getMaxNumericInColumn('Instance');
  const baseInstance = lastInstance >= 0 ? lastInstance : 0;

  for (const sig of deviceSignals) {
    if (!('registerType' in sig)) continue; // Skip non-Modbus signals

    const modbusSignal = sig as ModbusSignal;
    const signalId = `${modbusSignal.deviceId}_${modbusSignal.signalName}`;

    const objectType = mapModbusToBACnetObjectType(
      modbusSignal.dataType,
      modbusSignal.registerType
    );
    const instance = (instanceAllocation.get(signalId) ?? 1) + baseInstance;

    // Determine if signal is readable/writable based on BACnet object type
    // INPUT (AI, BI, MI): només READ
    // OUTPUT (AO, BO, MO): només WRITE
    // VALUE (AV, BV, MV): READ + WRITE
    const isInput = objectType.endsWith('I');
    const isOutput = objectType.endsWith('O');
    const isValue = objectType.endsWith('V');
    const isReadable = isInput || isValue;
    const isWritable = isOutput || isValue;
    const modbusFunctions = getModbusFunctions(
      modbusSignal.registerType,
      isReadable,
      isWritable
    );

    // Build row with all required columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // BACnet columns
    row[findCol('#')] = nextId++;
    row[findCol('Active')] = 'True';
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

    row[findCol('NC')] = '-';
    row[findCol('Texts')] = '-';
    row[findCol('# States')] = objectType.startsWith('B')
      ? '2'
      : objectType.startsWith('M')
      ? '65535'
      : '-';
    row[findCol('Rel. Def.')] = '-';
    row[findCol('COV')] = objectType.startsWith('A') ? '0' : '-'; // Analog values: 0, Binary/Multistate: -

    // Modbus columns (second #)
    const modbusIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('COV')
    );
    if (modbusIdCol >= 0) row[modbusIdCol] = nextId - 1;
    row[findCol('Device')] = `RTU // Port A // Device ${newDeviceNum}`;
    row[findCol('# Slave')] = newSlaveId;
    row[findCol('Base')] = '0-based';
    row[findCol('Read Func')] = modbusFunctions.read;
    row[findCol('Write Func')] = modbusFunctions.write;
    row[findCol('Data Length')] =
      modbusSignal.registerType === 'Coil' ? '1' : '16';
    row[findCol('Format')] =
      modbusSignal.registerType === 'Coil'
        ? '-'
        : getModbusFormat(modbusSignal.dataType);
    row[findCol('ByteOrder')] =
      modbusSignal.registerType === 'Coil' ? '-' : '0: Big Endian';
    row[findCol('Address')] = modbusSignal.address;
    row[findCol('Bit')] = '-';
    row[findCol('# Bits')] = '-';
    row[findCol('Deadband')] = '0';
    row[findCol('Conv. Id')] = '';
    row[findCol('Conversions')] = '-';

    signalsSheet.rows.push(row);
    rowsAdded++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
