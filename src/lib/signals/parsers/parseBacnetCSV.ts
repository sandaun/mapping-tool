import { BACnetSignal, ParseResult } from '../../../types/signals';
import { parseCSVLines, checkRequiredColumns } from './csvHelper';

export function parseBacnetCSV(csvText: string): ParseResult {
  const parsed = parseCSVLines(csvText);
  if (parsed?.warnings.length) {
    return { signals: [], warnings: parsed.warnings };
  }
  if (!parsed) return { signals: [], warnings: ['Invalid CSV Format'] };

  const { headers, dataLines } = parsed;
  const warnings: string[] = [];
  const signals: BACnetSignal[] = [];

  const requiredCols = ['deviceId', 'signalName', 'objectType', 'instance'];
  const missing = checkRequiredColumns(headers, requiredCols);
  if (missing) {
    return {
      signals: [],
      warnings: [`Missing required BACnet columns: ${missing.join(', ')}`],
    };
  }

  const getIdx = (col: string) => headers.indexOf(col);
  const deviceIdIdx = getIdx('deviceId');
  const signalNameIdx = getIdx('signalName');
  const objectTypeIdx = getIdx('objectType');
  const instanceIdx = getIdx('instance');
  const unitsIdx = getIdx('units');
  const descriptionIdx = getIdx('description');

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());

    const deviceId = cols[deviceIdIdx];
    const signalName = cols[signalNameIdx];
    const objectType = cols[objectTypeIdx];
    const instanceRaw = cols[instanceIdx];
    const units = unitsIdx >= 0 ? cols[unitsIdx] : undefined;
    const description = descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;

    if (!deviceId || !signalName || !objectType || !instanceRaw) {
      warnings.push(
        `Row ${i + 2}: required fields are empty (deviceId, signalName, objectType, instance).`,
      );
      continue;
    }

    const instance = parseInt(instanceRaw, 10);
    if (isNaN(instance)) {
      warnings.push(
        `Row ${i + 2}: instance "${instanceRaw}" is not a valid number.`,
      );
      continue;
    }

    signals.push({
      deviceId,
      signalName,
      objectType,
      instance,
      units,
      description,
    });
  }

  if (signals.length === 0 && warnings.length === 0) {
    warnings.push('No signals could be parsed from the input.');
  }

  return { signals, warnings };
}
