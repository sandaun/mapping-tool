export function parseCSVLines(
  csvText: string,
): { headers: string[]; dataLines: string[]; warnings: string[] } | null {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return {
      headers: [],
      dataLines: [],
      warnings: ['CSV is empty or contains only headers.'],
    };
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  return { headers, dataLines: lines.slice(1), warnings: [] };
}

export function checkRequiredColumns(
  headers: string[],
  requiredCols: string[],
): string[] | null {
  const missing = requiredCols.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return missing;
  }
  return null;
}
