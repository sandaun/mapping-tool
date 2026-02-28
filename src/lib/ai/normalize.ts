// ---------------------------------------------------------------------------
// Signal normalization — post-LLM response cleanup
// ---------------------------------------------------------------------------
// LLMs (especially those without native JSON Schema enforcement) return
// non-standard field values. This module normalises them before Zod validation.
// Applies to ALL providers as a safety net, but critical for Kimi.

import type { SignalInputType } from '@/types/signal-library';

// ── Modbus ──────────────────────────────────────────────────────────────────

const DATA_TYPE_ALIASES: Record<string, string> = {
  int16: 'Int16',
  s16: 'Int16',
  signed16: 'Int16',
  int8: 'Int16',
  uint16: 'Uint16',
  u16: 'Uint16',
  unsigned16: 'Uint16',
  word: 'Uint16',
  uint8: 'Uint16',
  ascii: 'Uint16',
  string: 'Uint16',
  int32: 'Int32',
  s32: 'Int32',
  signed32: 'Int32',
  uint32: 'Uint32',
  u32: 'Uint32',
  unsigned32: 'Uint32',
  dword: 'Uint32',
  uint48: 'Uint32',
  float32: 'Float32',
  f32: 'Float32',
  float: 'Float32',
  real: 'Float32',
  int64: 'Int64',
  s64: 'Int64',
  uint64: 'Uint64',
  u64: 'Uint64',
};

function normalizeModbus(json: Record<string, unknown>): void {
  const signals = json.signals;
  if (!Array.isArray(signals)) return;

  for (const signal of signals) {
    if (!signal || typeof signal !== 'object') continue;
    const s = signal as Record<string, unknown>;

    if (typeof s.dataType === 'string') {
      const normalized = DATA_TYPE_ALIASES[s.dataType.toLowerCase()];
      if (normalized) s.dataType = normalized;
    }

    // Fill missing nullable fields (some models omit them instead of null)
    if (!('factor' in s)) s.factor = null;
    if (!('units' in s)) s.units = null;
    if (!('description' in s)) s.description = null;
    if (!('mode' in s)) s.mode = null;
  }
}

// ── BACnet ──────────────────────────────────────────────────────────────────

const BACNET_OBJECT_TYPE_ALIASES: Record<string, string> = {
  ai: 'AI',
  'analog input': 'AI',
  analoginput: 'AI',
  'analog-input': 'AI',
  ao: 'AO',
  'analog output': 'AO',
  analogoutput: 'AO',
  'analog-output': 'AO',
  av: 'AV',
  'analog value': 'AV',
  analogvalue: 'AV',
  'analog-value': 'AV',
  bi: 'BI',
  'binary input': 'BI',
  binaryinput: 'BI',
  'binary-input': 'BI',
  bo: 'BO',
  'binary output': 'BO',
  binaryoutput: 'BO',
  'binary-output': 'BO',
  bv: 'BV',
  'binary value': 'BV',
  binaryvalue: 'BV',
  'binary-value': 'BV',
  msi: 'MSI',
  'multistate input': 'MSI',
  'multi-state input': 'MSI',
  multistateinput: 'MSI',
  mso: 'MSO',
  'multistate output': 'MSO',
  'multi-state output': 'MSO',
  multistateoutput: 'MSO',
  msv: 'MSV',
  'multistate value': 'MSV',
  'multi-state value': 'MSV',
  multistatevalue: 'MSV',
};

function normalizeBACnet(json: Record<string, unknown>): void {
  const signals = json.signals;
  if (!Array.isArray(signals)) return;

  for (const signal of signals) {
    if (!signal || typeof signal !== 'object') continue;
    const s = signal as Record<string, unknown>;

    if (typeof s.objectType === 'string') {
      const normalized = BACNET_OBJECT_TYPE_ALIASES[s.objectType.toLowerCase()];
      if (normalized) s.objectType = normalized;
    }

    if (!('units' in s)) s.units = null;
    if (!('description' in s)) s.description = null;
  }
}

// ── KNX ─────────────────────────────────────────────────────────────────────

function normalizeKNXDPT(raw: string): string {
  // DPST-1-1 → 1.001
  const dpstMatch = raw.match(/^DPST-?(\d+)-(\d+)$/i);
  if (dpstMatch) {
    return `${dpstMatch[1]}.${dpstMatch[2].padStart(3, '0')}`;
  }
  // DPT-9 → 9.001
  const dptMatch = raw.match(/^DPT-?(\d+)$/i);
  if (dptMatch) {
    return `${dptMatch[1]}.001`;
  }
  return raw;
}

function normalizeKNX(json: Record<string, unknown>): void {
  const signals = json.signals;
  if (!Array.isArray(signals)) return;

  for (const signal of signals) {
    if (!signal || typeof signal !== 'object') continue;
    const s = signal as Record<string, unknown>;

    if (typeof s.dpt === 'string') {
      s.dpt = normalizeKNXDPT(s.dpt);
    }
    if (!('description' in s)) s.description = null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Normalize raw JSON from any LLM before Zod validation.
 * Mutates `rawJson` in place.
 */
export function normalizeSignalResponse(
  inputType: SignalInputType,
  rawJson: Record<string, unknown>,
): void {
  switch (inputType) {
    case 'modbus':
      normalizeModbus(rawJson);
      break;
    case 'bacnet':
      normalizeBACnet(rawJson);
      break;
    case 'knx':
      normalizeKNX(rawJson);
      break;
  }
}
