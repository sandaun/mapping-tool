import type { MBSBACRawSignal } from "../types";
import type { RawSheet, CellValue } from "../../excel/raw";

/**
 * Column headers - must match adapters/mbs-bac.ts COLUMN_HEADERS exactly
 * Order: #, Active, Description, Data Length, Format, Address, Bit, Read / Write, String Length,
 *        #, Device Name, Type, Instance,
 *        Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  // Internal (Modbus Slave)
  "#",
  "Active",
  "Description",
  "Data Length",
  "Format",
  "Address",
  "Bit",
  "Read / Write",
  "String Length",
  // External (BACnet Client)
  "#",
  "Device Name",
  "Type",
  "Instance",
  // Extra
  "Conv. Id",
  "Conversions",
];

// Reverse mapping of BACnet type names to codes
const BAC_TYPE_CODES: Record<string, number> = {
  AI: 0,
  AO: 1,
  AV: 2,
  BI: 3,
  BO: 4,
  BV: 5,
  MI: 13,
  MO: 14,
  MV: 19,
};

// BACnet object type to ObjectID base multiplier
const BAC_TYPE_OBJECT_ID_BASE: Record<number, number> = {
  0: 0, // AI
  1: 4194304, // AO
  2: 8388608, // AV
  3: 12582912, // BI
  4: 16777216, // BO
  5: 20971520, // BV
  13: 54525952, // MI
  14: 58720256, // MO
  19: 79691776, // MV
};

/**
 * Extract numeric code from formatted values
 * "3: Low" -> 3, "16: 1 Register (16 bits)" -> 16, "-" -> fallback
 */
function extractLeadingCode(value: CellValue, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  if (str === "" || str === "-") return fallback;
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Extract BACnet type from formatted string
 * "5: BV" -> 5, "BV" -> 5
 */
function extractBacType(value: CellValue): number {
  if (value === null || value === undefined) return 2; // Default to AV
  const str = String(value).trim();
  if (str === "" || str === "-") return 2;

  // Try "number: name" format first
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);

  // Try just a number
  const num = parseInt(str, 10);
  if (!isNaN(num)) return num;

  // Try name lookup
  const upperStr = str.toUpperCase();
  for (const [name, code] of Object.entries(BAC_TYPE_CODES)) {
    if (upperStr.includes(name)) return code;
  }

  return 2; // Default to AV
}

/**
 * Safe number extraction
 */
function safeNumber(val: CellValue, fallback: number = -1): number {
  if (val === null || val === undefined || val === "-") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Parse boolean from display value
 * "True" -> true, "False" or empty -> false
 */
function parseBoolean(val: CellValue): boolean {
  if (val === null || val === undefined) return false;
  return String(val).toLowerCase() === "true";
}

/**
 * Calculate ObjectID from BACType and Instance
 */
function calculateObjectId(type: number, instance: number): number {
  const base = BAC_TYPE_OBJECT_ID_BASE[type] ?? 0;
  return base + instance;
}

/**
 * Converts rows from a RawSheet (MBS-BAC template) back to MBSBACRawSignal array.
 * Used when exporting new signals to ibmaps format.
 *
 * @param sheet The Signals sheet from RawWorkbook
 * @param startIdx Start index of rows to convert (0-based from rows array)
 * @param count Number of rows to convert
 * @returns Array of MBSBACRawSignal objects
 */
export function workbookRowsToMBSBACSignals(
  sheet: RawSheet,
  startIdx: number,
  count: number,
): MBSBACRawSignal[] {
  const rows = sheet.rows.slice(startIdx, startIdx + count);

  const columnIndex = new Map(
    COLUMN_HEADERS.map((header, index) => [header, index]),
  );

  const col = (name: string): number => columnIndex.get(name) ?? -1;

  // Use first '#' (index 0) for internal
  const firstHashIdx = COLUMN_HEADERS.indexOf("#");

  return rows.map((row) => {
    // Internal (Modbus Slave)
    const internalIdx = safeNumber(row[firstHashIdx], 0);
    const description = String(row[col("Description")] || "");
    const isEnabled = parseBoolean(row[col("Active")]);
    const dataLength = extractLeadingCode(row[col("Data Length")], 16);
    const format = extractLeadingCode(row[col("Format")], 0);
    const address = safeNumber(row[col("Address")], 0);
    const bit = safeNumber(row[col("Bit")], -1);
    const readWrite = extractLeadingCode(row[col("Read / Write")], 2);
    const stringLength = safeNumber(row[col("String Length")], -1);

    // External (BACnet Client)
    const deviceName = String(row[col("Device Name")] || "Device 0");
    const bacType = extractBacType(row[col("Type")]);
    const bacInstance = safeNumber(row[col("Instance")], 0);
    const objectId = calculateObjectId(bacType, bacInstance);

    // Extract device index from device name (e.g. "Device 3" → 3)
    let deviceIndex = 0;
    const deviceMatch = deviceName.match(/Device\s+(\d+)/i);
    if (deviceMatch) deviceIndex = parseInt(deviceMatch[1], 10);

    return {
      idxExternal: internalIdx,
      name: description,
      direction: "Modbus Slave->BACnet Client",
      modbusSlave: {
        description,
        dataLength,
        format,
        address,
        bit,
        readWrite,
        stringLength,
        isEnabled,
        virtual: false,
        extraAttrs: {},
      },
      bacnetClient: {
        deviceIndex,
        deviceName,
        bacType,
        bacInstance,
        objectId,
        active: true,
        virtual: false,
        extraAttrs: {},
      },
    };
  });
}
