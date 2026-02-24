import { ModbusSignal, ParseResult } from '../../../types/signals';
import { parseCSVLines, checkRequiredColumns } from './csvHelper';

function normalizeModbusRegisterType(raw: string): string {
  const value = raw.trim().toLowerCase();

  if (value.includes('coil')) return 'Coil';
  if (value.includes('discrete')) return 'DiscreteInput';
  if (value.includes('input') || value.includes('fc04') || value === '4') {
    return 'InputRegister';
  }
  if (value.includes('holding') || value.includes('fc03') || value === '3') {
    return 'HoldingRegister';
  }

  return raw.trim();
}

function normalizeModbusDataType(raw: string): string {
  const value = raw.trim();
  const lower = value.toLowerCase();

  // Software does not support 8-bit data length, normalize to 16-bit.
  if (lower === 's8') return 'Int16';
  if (lower === 'u8') return 'Uint16';
  if (lower === 's16') return 'Int16';
  if (lower === 'u16') return 'Uint16';
  if (lower === 's32') return 'Int32';
  if (lower === 'u32') return 'Uint32';
  if (lower === 'f32') return 'Float32';

  return value;
}

export function parseModbusCSV(csvText: string): ParseResult {
  const parsed = parseCSVLines(csvText);
  if (parsed?.warnings.length) {
    return { signals: [], warnings: parsed.warnings };
  }
  if (!parsed) return { signals: [], warnings: ['Invalid CSV Format'] };

  const { headers, dataLines } = parsed;
  const warnings: string[] = [];
  const signals: ModbusSignal[] = [];

  const requiredCols = [
    'deviceId',
    'signalName',
    'registerType',
    'address',
    'dataType',
  ];
  const missing = checkRequiredColumns(headers, requiredCols);
  if (missing) {
    return {
      signals: [],
      warnings: [`Missing required Modbus columns: ${missing.join(', ')}`],
    };
  }

  const getIdx = (col: string) => headers.indexOf(col);
  const deviceIdIdx = getIdx('deviceId');
  const signalNameIdx = getIdx('signalName');
  const registerTypeIdx = getIdx('registerType');
  const addressIdx = getIdx('address');
  const dataTypeIdx = getIdx('dataType');
  const unitsIdx = getIdx('units');
  const descriptionIdx = getIdx('description');
  const modeIdx = getIdx('mode'); // Optional
  const factorIdx = getIdx('factor'); // Optional

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());

    const deviceId = cols[deviceIdIdx];
    const signalName = cols[signalNameIdx];
    const registerTypeRaw = cols[registerTypeIdx];
    const addressRaw = cols[addressIdx];
    const dataTypeRaw = cols[dataTypeIdx];
    const units = unitsIdx >= 0 ? cols[unitsIdx] : undefined;
    const description = descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;
    const mode = modeIdx >= 0 ? cols[modeIdx] : undefined;
    const factorRaw = factorIdx >= 0 ? cols[factorIdx] : undefined;

    if (
      !deviceId ||
      !signalName ||
      !registerTypeRaw ||
      !addressRaw ||
      !dataTypeRaw
    ) {
      warnings.push(
        `Row ${i + 2}: required fields are empty (deviceId, signalName, registerType, address, dataType).`,
      );
      continue;
    }

    const address = parseInt(addressRaw, 10);
    if (isNaN(address)) {
      warnings.push(
        `Row ${i + 2}: address "${addressRaw}" is not a valid number.`,
      );
      continue;
    }

    const factor =
      factorRaw && factorRaw.trim() !== '' ? parseFloat(factorRaw) : undefined;

    signals.push({
      deviceId,
      signalName,
      registerType: normalizeModbusRegisterType(registerTypeRaw),
      address,
      dataType: normalizeModbusDataType(dataTypeRaw),
      units,
      description,
      mode: mode && mode.trim() !== '' ? mode.trim() : undefined,
      factor: factor && !isNaN(factor) ? factor : undefined,
    });
  }

  if (signals.length === 0 && warnings.length === 0) {
    warnings.push('No signals could be parsed from the input.');
  }

  return { signals, warnings };
}
