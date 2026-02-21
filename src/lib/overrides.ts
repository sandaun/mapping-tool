import type { RawWorkbook, CellValue } from "./excel/raw";
import type { Override, EditableRow } from "@/types/overrides";
import { findSignalsSheet } from "./actions/utils/common";
import { EDITABLE_COLUMNS } from "@/constants/editableColumns";

/**
 * Applies a list of overrides to a list of rows.
 * This is a pure function that returns a new array.
 */
export function applyOverrides<T extends EditableRow>(
  rows: T[],
  overrides: Override[],
): T[] {
  let result = [...rows];

  for (const override of overrides) {
    if (override.type === "delete") {
      result = result.filter((row) => row.id !== override.signalId);
    } else if (override.type === "edit") {
      result = result.map((row) => {
        if (row.id === override.signalId) {
          return { ...row, [override.field]: override.value };
        }
        return row;
      });
    } else if (override.type === "reorder") {
      // Reorder logic (if needed later)
      // const [moved] = result.splice(override.fromIndex, 1);
      // result.splice(override.toIndex, 0, moved);
    }
  }

  return result;
}

/**
 * Templates where BACnet instances are server-managed and must be
 * renumbered contiguously per BACnet object type after deletions.
 */
const BACNET_SERVER_TEMPLATES = new Set([
  "bacnet-server__modbus-master",
  "bacnet-server__knx",
]);

/**
 * Renumber # (and BACnet Instance where applicable) after overrides.
 * Pure function — does NOT mutate input or change row IDs.
 */
export function renumberSignals(
  rows: EditableRow[],
  templateId: string,
): EditableRow[] {
  if (rows.length === 0) return rows;

  const renumberInstances = BACNET_SERVER_TEMPLATES.has(templateId);

  if (renumberInstances) {
    const nextInstanceByType = new Map<string, number>();
    return rows.map((row, index) => {
      const typeKey = String(row["Type"] ?? "")
        .split(":")[0]
        .trim();
      const instance = nextInstanceByType.get(typeKey) ?? 0;
      nextInstanceByType.set(typeKey, instance + 1);
      return { ...row, "#": index, Instance: instance };
    });
  }

  return rows.map((row, index) => ({ ...row, "#": index }));
}

/**
 * Helper to find the header row index by looking for expected columns.
 * Scans first 20 rows and returns index of row with most matches.
 *
 * Scans from the top so it works for both XLSX and IBMAPS shapes.
 */
function findHeaderRowIndex(
  rows: CellValue[][],
  expectedColumns: string[],
): number {
  const scanLimit = Math.min(rows.length, 30);

  for (let i = 0; i < scanLimit; i++) {
    const rowValues = rows[i].map((c) => String(c || "").trim());

    // Count how many expected columns are present in this row
    const matchCount = expectedColumns.reduce((count, col) => {
      return rowValues.includes(col) ? count + 1 : count;
    }, 0);

    // Heuristic: If we match at least 3 distinctive columns or >50% of them
    // (Use 2 as fallback for templates with very few columns)
    const threshold = Math.max(2, Math.min(3, expectedColumns.length));

    if (matchCount >= threshold) {
      return i;
    }
  }

  return -1;
}

/**
 * Helper to extract signal rows from a RawWorkbook into a friendly object format.
 * Only extracts the relevant protocol columns based on the gateway type.
 */
export function extractSignalsFromWorkbook(
  workbook: RawWorkbook,
  templateId: string,
): EditableRow[] {
  const sheet = findSignalsSheet(workbook);
  if (!sheet || sheet.rows.length < 2) return [];

  const allowedColumns =
    EDITABLE_COLUMNS[templateId as keyof typeof EDITABLE_COLUMNS] || [];

  // Find header row robustly
  const headerRowIndex = findHeaderRowIndex(sheet.rows, allowedColumns);

  if (headerRowIndex === -1) {
    console.warn(
      `Could not find header row in Signals sheet for template ${templateId}`,
    );
    return [];
  }

  const headers = sheet.rows[headerRowIndex].map((cell) =>
    String(cell || "").trim(),
  );
  const dataRows = sheet.rows.slice(headerRowIndex + 1);

  // Find indices of allowed columns
  const columnIndices = new Map<string, number>();
  allowedColumns.forEach((colName) => {
    const idx = headers.indexOf(colName);
    if (idx >= 0) {
      columnIndices.set(colName, idx);
    }
  });

  return dataRows.map((row, index) => {
    const rowObj: EditableRow = {
      id: `row-${index}`, // Fallback ID
    };

    // Only extract allowed columns
    columnIndices.forEach((colIdx, colName) => {
      rowObj[colName] = row[colIdx];
    });

    // Create a better ID from the row content
    const name = rowObj["Name"] || "";
    const type = rowObj["Type"] || "";
    const instance = rowObj["Instance"] || rowObj["Address"] || "";

    if (name) {
      rowObj.id = `${name}_${type}_${instance}_${index}`;
    }

    return rowObj;
  });
}

/**
 * Applies overrides directly to a deep copy of the RawWorkbook.
 * Used for export. Preserves ALL original columns.
 */
export function applyOverridesToWorkbook(
  workbook: RawWorkbook,
  overrides: Override[],
  templateId: string,
): RawWorkbook {
  const newWorkbook = JSON.parse(JSON.stringify(workbook)) as RawWorkbook;
  const sheet = findSignalsSheet(newWorkbook);
  if (!sheet || sheet.rows.length < 2) return newWorkbook;

  const allowedColumns =
    EDITABLE_COLUMNS[templateId as keyof typeof EDITABLE_COLUMNS] || [];
  const headerRowIndex = findHeaderRowIndex(sheet.rows, allowedColumns);

  if (headerRowIndex === -1) {
    console.warn(
      `Could not find header row in Signals sheet for template ${templateId}`,
    );
    return newWorkbook;
  }

  const headers = sheet.rows[headerRowIndex].map((cell) =>
    String(cell || "").trim(),
  );
  const dataRows = sheet.rows.slice(headerRowIndex + 1);

  // Build column indices for quick lookup
  const columnIndices = new Map<string, number>();
  headers.forEach((header, idx) => {
    if (header) {
      columnIndices.set(header, idx);
    }
  });

  // Generate IDs for all rows (using same logic as extractSignalsFromWorkbook)
  const rowIdMap = new Map<string, number>(); // id -> original row index in dataRows
  dataRows.forEach((row, index) => {
    const nameIdx = columnIndices.get("Name");
    const typeIdx = columnIndices.get("Type");
    const instanceIdx = columnIndices.get("Instance");
    const addressIdx = columnIndices.get("Address");

    const name = nameIdx !== undefined ? String(row[nameIdx] || "") : "";
    const type = typeIdx !== undefined ? String(row[typeIdx] || "") : "";
    const instance =
      instanceIdx !== undefined
        ? String(row[instanceIdx] || "")
        : addressIdx !== undefined
          ? String(row[addressIdx] || "")
          : "";

    const id = name ? `${name}_${type}_${instance}_${index}` : `row-${index}`;
    rowIdMap.set(id, index);
  });

  // Apply overrides
  const deletedIndices = new Set<number>();
  const editedCells = new Map<string, CellValue>(); // "rowIndex_colName" -> newValue

  for (const override of overrides) {
    if (override.type === "delete") {
      const rowIndex = rowIdMap.get(override.signalId);
      if (rowIndex !== undefined) {
        deletedIndices.add(rowIndex);
      }
    } else if (override.type === "edit") {
      const rowIndex = rowIdMap.get(override.signalId);
      if (rowIndex !== undefined) {
        const key = `${rowIndex}_${override.field}`;
        editedCells.set(key, override.value as CellValue);
      }
    }
  }

  // Rebuild rows array
  const newDataRows: CellValue[][] = [];

  dataRows.forEach((row, index) => {
    // Skip deleted rows
    if (deletedIndices.has(index)) {
      return;
    }

    // Clone the row to preserve all original columns
    const newRow = [...row];

    // Apply edits to specific cells
    headers.forEach((header, colIdx) => {
      const key = `${index}_${header}`;
      if (editedCells.has(key)) {
        newRow[colIdx] = editedCells.get(key)!;
      }
    });

    newDataRows.push(newRow);
  });

  // Reconstruct the complete sheet preserving metadata rows before header
  const finalRows = [
    ...sheet.rows.slice(0, headerRowIndex), // Metadata rows
    sheet.rows[headerRowIndex], // Header row
    ...newDataRows, // Data rows
  ];

  // Renumber # columns (internal + external) and BACnet Instance
  const hashIndices: number[] = [];
  headers.forEach((h, i) => {
    if (h === "#") hashIndices.push(i);
  });

  const renumberInstances = [
    "bacnet-server__modbus-master",
    "bacnet-server__knx",
  ].includes(templateId);

  const instanceColIdx = columnIndices.get("Instance");
  const typeColIdx = columnIndices.get("Type");

  if (
    renumberInstances &&
    instanceColIdx !== undefined &&
    typeColIdx !== undefined
  ) {
    const nextInstanceByType = new Map<string, number>();
    const dataStart = headerRowIndex + 1;
    for (let i = dataStart; i < finalRows.length; i++) {
      const row = finalRows[i];
      // Renumber #
      for (const hi of hashIndices) row[hi] = i - dataStart;
      // Renumber Instance per Type
      const typeKey = String(row[typeColIdx] ?? "")
        .split(":")[0]
        .trim();
      const inst = nextInstanceByType.get(typeKey) ?? 0;
      nextInstanceByType.set(typeKey, inst + 1);
      row[instanceColIdx] = inst;
    }
  } else {
    const dataStart = headerRowIndex + 1;
    for (let i = dataStart; i < finalRows.length; i++) {
      for (const hi of hashIndices) finalRows[i][hi] = i - dataStart;
    }
  }

  sheet.rows = finalRows;
  return newWorkbook;
}
