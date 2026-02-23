/**
 * Protocol-related constants for parsing and UI styling.
 */

export const PROTOCOL_NAMES = ['BACnet', 'Modbus', 'KNX'] as const;
export const PROTOCOL_ROLES = ['Server', 'Master', 'Client', 'Slave'] as const;

export const PROTOCOL_COLOR: Record<string, string> = {
  BACnet:
    'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800',
  Modbus:
    'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  KNX: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
};

export const DEFAULT_PROTOCOL_COLOR =
  'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

// Hover-only variants (used when subdued=true — parent must have `group` class)
export const PROTOCOL_HOVER_COLOR: Record<string, string> = {
  BACnet:
    'group-hover:bg-sky-100 group-hover:text-sky-700 group-hover:ring-sky-200 dark:group-hover:bg-sky-900/30 dark:group-hover:text-sky-400 dark:group-hover:ring-sky-800',
  Modbus:
    'group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:ring-amber-200 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400 dark:group-hover:ring-amber-800',
  KNX: 'group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:ring-emerald-200 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400 dark:group-hover:ring-emerald-800',
};

export const DEFAULT_HOVER_COLOR =
  'group-hover:bg-slate-100 group-hover:text-slate-700 group-hover:ring-slate-200';

export const SUBDUED_BASE = 'bg-muted text-muted-foreground ring-border';
