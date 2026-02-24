import { KNXSignal, ParseResult } from '../../../types/signals';

/**
 * Clean field: remove all quotes and trim
 */
function cleanField(field: string | undefined): string {
  if (!field) return '';
  return field.replace(/["']/g, '').trim();
}

/**
 * Normalize DPT format from ETS to standard format
 * "DPST-1-1" → "1.001"
 * "DPT-7" → "7.001"
 */
function normalizeDPT(dptRaw: string): string {
  if (!dptRaw) return '';

  // Match "DPST-X-Y"
  const matchDPST = dptRaw.match(/DPST-(\d+)-(\d+)/i);
  if (matchDPST) {
    const main = matchDPST[1];
    const sub = matchDPST[2].padStart(3, '0');
    return `${main}.${sub}`;
  }

  // Match "DPT-X"
  const matchDPT = dptRaw.match(/DPT-(\d+)/i);
  if (matchDPT) {
    return `${matchDPT[1]}.001`;
  }

  // Already in correct format "9.001"
  if (/^\d+\.\d+$/.test(dptRaw)) {
    return dptRaw;
  }

  return '';
}

/**
 * Parse ETS CSV export format
 * Format: "Level1, Level2, Level3, GroupAddress, ..., DPT, ..."
 */
export function parseKnxEtsCSV(csvText: string): ParseResult {
  const signals: KNXSignal[] = [];
  const warnings: string[] = [];
  const lines = csvText.trim().split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Remove outer quotes if present
    let cleanLine = line.trim();
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
      cleanLine = cleanLine.slice(1, -1);
    }

    // Split by comma
    const fields = cleanLine.split(',').map((f) => f.trim());

    // ETS format: col 2 = signal name, col 3 = GA, col 7 = DPT
    const signalName = cleanField(fields[2]);
    const groupAddress = cleanField(fields[3]);
    const dptRaw = cleanField(fields[7]);

    // Skip if not a signal line (no name or GA is incomplete like "2/-/-")
    if (!signalName || !groupAddress || groupAddress.includes('/-/')) {
      continue;
    }

    // Normalize DPT format
    const dpt = normalizeDPT(dptRaw);
    if (!dpt) {
      warnings.push(
        `Signal "${signalName}" has no valid DPT (${dptRaw}), skipped.`,
      );
      continue;
    }

    signals.push({
      signalName,
      groupAddress,
      dpt,
    });
  }

  if (signals.length === 0) {
    warnings.push(
      'No valid signals found in the ETS CSV. Please verify the format.',
    );
  }

  return { signals, warnings };
}
