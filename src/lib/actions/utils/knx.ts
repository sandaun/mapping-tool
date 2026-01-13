/**
 * KNX utilities for Group Address handling and DPT mapping
 */

// ============================================================
// GROUP ADDRESS UTILITIES
// ============================================================

export interface GroupAddress {
  main: number; // 0-31 (5 bits)
  middle: number; // 0-7 (3 bits)
  sub: number; // 0-255 (8 bits)
}

/**
 * Parse a KNX Group Address string in 3-level format (Main/Middle/Sub)
 * @param addr - Group address string (e.g., "0/0/1")
 * @returns Parsed group address object
 */
export function parseGroupAddress(addr: string): GroupAddress {
  const parts = addr.split('/').map(Number);

  if (parts.length !== 3) {
    throw new Error(
      `Invalid group address format: ${addr}. Expected format: Main/Middle/Sub`
    );
  }

  const [main, middle, sub] = parts;

  if (main < 0 || main > 31) {
    throw new Error(`Main group out of range (0-31): ${main}`);
  }
  if (middle < 0 || middle > 7) {
    throw new Error(`Middle group out of range (0-7): ${middle}`);
  }
  if (sub < 0 || sub > 255) {
    throw new Error(`Subgroup out of range (0-255): ${sub}`);
  }

  return { main, middle, sub };
}

/**
 * Format a GroupAddress object back to string format
 * @param addr - GroupAddress object
 * @returns Formatted string (e.g., "0/0/1")
 */
export function formatGroupAddress({
  main,
  middle,
  sub,
}: GroupAddress): string {
  return `${main}/${middle}/${sub}`;
}

/**
 * Increment a group address by 1 in the subgroup field.
 * Handles overflow: sub > 255 → increment middle, middle > 7 → increment main.
 * @param addr - Current group address
 * @returns Incremented group address
 * @throws Error if main group overflows (> 31)
 */
export function incrementGroupAddress(addr: GroupAddress): GroupAddress {
  let { main, middle, sub } = addr;

  sub++;

  if (sub > 255) {
    sub = 0;
    middle++;
  }

  if (middle > 7) {
    middle = 0;
    main++;
  }

  if (main > 31) {
    throw new Error('Group address overflow: main group exceeded maximum (31)');
  }

  return { main, middle, sub };
}

// ============================================================
// KNX FLAGS UTILITIES
// ============================================================

export interface KNXFlags {
  U: boolean; // Update on startup
  T: boolean; // Transmit on telegram
  Ri: boolean; // Read on init (incompatible with R)
  W: boolean; // Write permission
  R: boolean; // Read permission (incompatible with Ri)
}

/**
 * Generate default KNX flags based on signal read/write capabilities
 * @param isReadable - Signal can be read from Modbus
 * @param isWritable - Signal can be written to Modbus
 * @returns Default KNX flags configuration
 */
export function getDefaultKNXFlags(
  isReadable: boolean,
  isWritable: boolean
): KNXFlags {
  return {
    U: true, // Always update on startup
    T: isReadable, // Transmit if readable
    Ri: false, // Read on init: always disabled by default (incompatible with R)
    W: isWritable, // Write permission
    R: isReadable, // Read permission (incompatible with Ri)
  };
}

/**
 * KNX priority levels with formatted labels
 * Format: "value: label" (e.g., "3: Low")
 */
export const KNX_PRIORITY_LEVELS = {
  SYSTEM: '0: System',
  NORMAL: '1: Normal',
  URGENT: '2: Urgent',
  LOW: '3: Low',
} as const;

/**
 * Default KNX priority: Low (3)
 * This is the default value used in MAPS templates
 */
export const DEFAULT_KNX_PRIORITY = KNX_PRIORITY_LEVELS.LOW;
