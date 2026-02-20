import type { DeviceSignal } from '@/lib/deviceSignals';

/**
 * Signal input type — the raw protocol of the signals stored.
 * Only modbus and bacnet are used in the library (KNX uses projects, not devices).
 */
export type SignalInputType = 'modbus' | 'bacnet' | 'knx';

/**
 * A record as stored in the signal_library table.
 */
export type SignalLibraryRecord = {
  id: string;
  manufacturer: string;
  model: string;
  manufacturer_norm: string;
  model_norm: string;
  input_type: SignalInputType;
  signals: DeviceSignal[];
  parser_version: string;
  parser_provider: string | null;
  parser_model: string | null;
  parse_warnings: string[];
  confidence_stats: { high: number; medium: number; low: number } | null;
  source_file_name: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Payload for saving signals to the library via POST /api/signal-library.
 */
export type SignalLibrarySavePayload = {
  manufacturer: string;
  model: string;
  inputType: SignalInputType;
  signals: DeviceSignal[];
  parserVersion: string;
  parserProvider?: string;
  parserModel?: string;
  parseWarnings?: string[];
  confidenceStats?: { high: number; medium: number; low: number };
  sourceFileName?: string;
  sourceFileType?: string;
  sourceFileSize?: number;
  overwrite?: boolean;
};

/**
 * API response for GET listing.
 */
export type SignalLibraryListResponse = {
  records: SignalLibraryRecord[];
  total: number;
};

/**
 * API response for POST save.
 */
export type SignalLibrarySaveResponse = {
  record: SignalLibraryRecord;
  created: boolean;
};
