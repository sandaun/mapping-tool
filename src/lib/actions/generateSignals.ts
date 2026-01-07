import type { RawWorkbook, CellValue } from '../excel/raw';
import type {
  DeviceSignal,
  ModbusSignal,
  BACnetSignal,
} from '../deviceSignals';
import { detectUnitFromSignalName } from '../../constants/bacnetUnits';

// ============================================================
// POLICIES (address/instance allocation)
// ============================================================

type AllocationPolicy = 'simple'; // Futur: 'grouped-by-device', 'offset-by-type', etc.

/**
 * Allocate Modbus addresses with simple sequential policy.
 * Returns map: signalId -> address
 */
function allocateModbusAddresses(
  signals: DeviceSignal[],
  policy: AllocationPolicy = 'simple'
): Map<string, number> {
  const allocation = new Map<string, number>();

  if (policy === 'simple') {
    let coilAddress = 0;
    let holdingAddress = 0;

    for (const sig of signals) {
      const signalId = `${sig.deviceId}_${sig.signalName}`;

      // Determinar registerType segons objectType (BACnet → Modbus)
      if ('objectType' in sig) {
        const registerType = mapBACnetToModbusRegisterType(sig.objectType);
        if (registerType === 'Coil') {
          allocation.set(signalId, coilAddress++);
        } else {
          allocation.set(signalId, holdingAddress++);
        }
      }
    }
  }

  return allocation;
}

/**
 * Allocate BACnet instances with simple sequential policy.
 * Returns map: signalId -> instance
 */
function allocateBACnetInstances(
  signals: DeviceSignal[],
  policy: AllocationPolicy = 'simple'
): Map<string, number> {
  const allocation = new Map<string, number>();

  if (policy === 'simple') {
    let instance = 1;

    for (const sig of signals) {
      const signalId = `${sig.deviceId}_${sig.signalName}`;
      allocation.set(signalId, instance++);
    }
  }

  return allocation;
}

// ============================================================
// MAPPING RULES (protocol conversions)
// ============================================================

/**
 * Map Modbus dataType + registerType → BACnet objectType
 */
function mapModbusToBACnetObjectType(
  dataType: string,
  registerType: string
): string {
  // Coils i DiscreteInput → Binary
  if (registerType === 'Coil' || registerType === 'DiscreteInput') {
    return 'BI';
  }

  // HoldingRegister / InputRegister segons dataType
  if (dataType.includes('Float') || dataType.includes('Int')) {
    return 'AI'; // Analog Input
  }

  // Fallback
  return 'AV'; // Analog Value
}

/**
 * Map BACnet objectType → Modbus registerType
 */
function mapBACnetToModbusRegisterType(objectType: string): string {
  // Binary objects → Coil
  if (objectType === 'BI' || objectType === 'BO' || objectType === 'BV') {
    return 'Coil';
  }

  // Analog objects → HoldingRegister
  if (objectType === 'AI' || objectType === 'AO' || objectType === 'AV') {
    return 'HoldingRegister';
  }

  // Multistate → HoldingRegister
  if (objectType === 'MSI' || objectType === 'MSO' || objectType === 'MSV') {
    return 'HoldingRegister';
  }

  // Fallback
  return 'HoldingRegister';
}

/**
 * Map BACnet objectType → Modbus dataType
 */
function mapBACnetToModbusDataType(objectType: string): string {
  // Binary → Bool/Uint16
  if (objectType === 'BI' || objectType === 'BO' || objectType === 'BV') {
    return 'Uint16';
  }

  // Analog → Float32 (assumim floating point per defecte)
  if (objectType === 'AI' || objectType === 'AO' || objectType === 'AV') {
    return 'Float32';
  }

  // Multistate → Uint16
  if (objectType === 'MSI' || objectType === 'MSO' || objectType === 'MSV') {
    return 'Uint16';
  }

  return 'Float32';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Finds the row index where the actual headers are located (looking for "#", "Active", etc.)
 */
function findHeaderRowIndex(sheet: {
  headers: (string | null)[];
  rows: CellValue[][];
}): number {
  // Check if headers row already has characteristic columns
  if (sheet.headers.some((h) => h === '#' || h === 'Active' || h === 'Name')) {
    return -1; // Headers are at row -1 (means sheet.headers is the header row)
  }

  // Search in rows for the header row
  for (let i = 0; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    if (
      row.some((cell) => cell === '#' || cell === 'Active' || cell === 'Name')
    ) {
      return i;
    }
  }

  return -1; // Not found
}

/**
 * Map BACnet object type code to generic signal name
 */
function getBACnetTypeName(objectType: string): string {
  const nameMap: Record<string, string> = {
    AI: 'Analog Input',
    AO: 'Analog Output',
    AV: 'Analog Value',
    BI: 'Binary Input',
    BO: 'Binary Output',
    BV: 'Binary Value',
    MI: 'Multistate Input',
    MO: 'Multistate Output',
    MV: 'Multistate Value',
  };
  return nameMap[objectType] ?? objectType;
}

/**
 * Detect the highest device number already in the Signals sheet
 */
function getLastDeviceNumber(sheet: {
  headers: (string | null)[];
  rows: CellValue[][];
}): number {
  const headerRowIdx = findHeaderRowIndex(sheet);
  const headers = headerRowIdx >= 0 ? sheet.rows[headerRowIdx] : sheet.headers;
  const deviceColIdx = headers.findIndex((h) => h === 'Device');

  if (deviceColIdx < 0) return -1;

  let maxDevice = -1;
  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

  for (let i = startRow; i < sheet.rows.length; i++) {
    const deviceValue = sheet.rows[i][deviceColIdx];
    if (typeof deviceValue === 'string') {
      // Parse "RTU // Port A // Device 0" → extract 0
      const match = deviceValue.match(/Device (\d+)/);
      if (match) {
        const deviceNum = parseInt(match[1], 10);
        if (deviceNum > maxDevice) maxDevice = deviceNum;
      }
    }
  }

  return maxDevice;
}

/**
 * Map BACnet object type code to full format with prefix (e.g., "AI" → "0: AI")
 */
function formatBACnetType(objectType: string): string {
  const typeMap: Record<string, string> = {
    AI: '0: AI',
    AO: '1: AO',
    AV: '2: AV',
    BI: '3: BI',
    BO: '4: BO',
    BV: '5: BV',
    MI: '13: MI',
    MO: '14: MO',
    MV: '19: MV',
  };
  return typeMap[objectType] ?? objectType;
}

/**
 * Map Modbus register type to read/write function codes
 */
function getModbusFunctions(
  registerType: string,
  isReadable: boolean,
  isWritable: boolean
): { read: string; write: string } {
  if (registerType === 'Coil') {
    return {
      read: isReadable ? '1: Read Coils' : '-',
      write: isWritable ? '5: Write Single Coil' : '-',
    };
  } else {
    // HoldingRegister
    return {
      read: isReadable ? '3: Read Holding Registers' : '-',
      write: isWritable ? '6: Write Single Register' : '-',
    };
  }
}

/**
 * Map Modbus data type to Format code
 * 0: Unsigned, 1: Signed (C2), 2: Signed (C1), 3: Float, 4: BitFields
 */
function getModbusFormat(dataType: string): string {
  if (dataType.includes('Float')) return '3: Float';
  if (
    dataType.toLowerCase().includes('signed') &&
    !dataType.includes('Unsigned')
  )
    return '1: Signed';
  return '0: Unsigned';
}

// ============================================================
// MAIN ACTION
// ============================================================

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

/**
 * Generate Signals rows from device signals and write to RAW workbook.
 * Gateway type determines mapping direction (Modbus→BACnet or BACnet→Modbus).
 */
export function generateSignalsRows(
  deviceSignals: DeviceSignal[],
  gatewayType: 'bacnet-server__modbus-master' | 'modbus-slave__bacnet-client',
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

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Detect last device number to auto-increment
  const lastDeviceNum = getLastDeviceNumber(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;
  const newSlaveId = 10 + newDeviceNum; // Slave ID = 10 + device number

  if (gatewayType === 'bacnet-server__modbus-master') {
    // Device signals = Modbus → Generate BACnet columns
    const instanceAllocation = allocateBACnetInstances(deviceSignals, policy);

    for (const sig of deviceSignals) {
      if (!('registerType' in sig)) continue; // Skip non-Modbus signals

      const modbusSignal = sig as ModbusSignal;
      const signalId = `${modbusSignal.deviceId}_${modbusSignal.signalName}`;

      const objectType = mapModbusToBACnetObjectType(
        modbusSignal.dataType,
        modbusSignal.registerType
      );
      const instance = instanceAllocation.get(signalId) ?? 0;

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
      row[findCol('Description')] = modbusSignal.signalName; // Nom específic de la senyal
      row[findCol('Name')] = getBACnetTypeName(objectType); // Nom genèric del tipus
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
  } else {
    // Device signals = BACnet → Generate Modbus columns
    const addressAllocation = allocateModbusAddresses(deviceSignals, policy);

    for (const sig of deviceSignals) {
      if (!('objectType' in sig)) continue; // Skip non-BACnet signals

      const bacnetSignal = sig as BACnetSignal;
      const signalId = `${bacnetSignal.deviceId}_${bacnetSignal.signalName}`;

      const registerType = mapBACnetToModbusRegisterType(
        bacnetSignal.objectType
      );
      const dataType = mapBACnetToModbusDataType(bacnetSignal.objectType);
      const address = addressAllocation.get(signalId) ?? 0;

      // Determine if signal is readable/writable based on BACnet object type
      // INPUT (AI, BI, MI): només READ
      // OUTPUT (AO, BO, MO): només WRITE
      // VALUE (AV, BV, MV): READ + WRITE
      const isInput = bacnetSignal.objectType.endsWith('I');
      const isOutput = bacnetSignal.objectType.endsWith('O');
      const isValue = bacnetSignal.objectType.endsWith('V');
      const isReadable = isInput || isValue;
      const isWritable = isOutput || isValue;
      const modbusFunctions = getModbusFunctions(
        registerType,
        isReadable,
        isWritable
      );

      // Build row with all required columns
      const row: CellValue[] = new Array(headers.length).fill(null);

      // BACnet columns
      row[findCol('#')] = nextId++;
      row[findCol('Active')] = 'True';
      row[findCol('Description')] = bacnetSignal.signalName; // Nom específic de la senyal
      row[findCol('Name')] = getBACnetTypeName(bacnetSignal.objectType); // Nom genèric del tipus
      row[findCol('Type')] = formatBACnetType(bacnetSignal.objectType);
      row[findCol('Instance')] = bacnetSignal.instance;
      // Auto-detect units from signal name, fallback to defaults
      let unitCode: number | string;
      if (bacnetSignal.objectType.startsWith('B')) {
        unitCode = '-1'; // Binary: always -1
      } else if (bacnetSignal.objectType.startsWith('M')) {
        unitCode = '-1'; // Multistate: always -1
      } else {
        // Analog: try to detect from signal name
        unitCode = detectUnitFromSignalName(bacnetSignal.signalName);
      }
      row[findCol('Units')] = unitCode;
      row[findCol('NC')] = '-';
      row[findCol('Texts')] = '-';
      row[findCol('# States')] = bacnetSignal.objectType.startsWith('B')
        ? '2'
        : bacnetSignal.objectType.startsWith('M')
        ? '65535'
        : '-';
      row[findCol('Rel. Def.')] = isWritable ? '0' : '-';
      row[findCol('COV')] = bacnetSignal.objectType.startsWith('A') ? '0' : '-'; // Analog values: 0, Binary/Multistate: -

      // Modbus columns
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
        registerType === 'Coil' ? '1' : dataType.includes('32') ? '32' : '16';
      row[findCol('Format')] =
        registerType === 'Coil' ? '-' : getModbusFormat(dataType);
      row[findCol('ByteOrder')] =
        registerType === 'Coil' ? '-' : '0: Big Endian';
      row[findCol('Address')] = address;
      row[findCol('Bit')] = '-';
      row[findCol('# Bits')] = '-';
      row[findCol('Deadband')] = '0';
      row[findCol('Conv. Id')] = '';
      row[findCol('Conversions')] = '-';

      signalsSheet.rows.push(row);
      rowsAdded++;
    }
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
