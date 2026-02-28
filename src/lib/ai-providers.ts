import type { TemplateId } from '@/types/page.types';
import type { SignalInputType } from '@/types/signal-library';

// ---------------------------------------------------------------------------
// AI Provider types & constants (client-safe — no server imports)
// ---------------------------------------------------------------------------

export type AIProvider = 'openai' | 'kimi';

export const PROVIDER_LABEL: Record<AIProvider, string> = {
  openai: 'OpenAI',
  kimi: 'Kimi',
};

export function isAIProvider(value: unknown): value is AIProvider {
  return value === 'openai' || value === 'kimi';
}

// ---------------------------------------------------------------------------
// Template → input type mapping
// ---------------------------------------------------------------------------

export const TEMPLATE_INPUT_TYPE: Record<TemplateId, SignalInputType> = {
  'bacnet-server__modbus-master': 'modbus',
  'knx__modbus-master': 'modbus',
  'modbus-slave__bacnet-client': 'bacnet',
  'knx__bacnet-client': 'bacnet',
  'modbus-slave__knx': 'knx',
  'bacnet-server__knx': 'knx',
};
