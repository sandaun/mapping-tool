import type { TemplateId } from '@/types/page.types';
import type { SignalInputType } from '@/types/signal-library';

// ---------------------------------------------------------------------------
// AI Provider types & constants
// ---------------------------------------------------------------------------

export type AIProvider = 'openai' | 'groq' | 'cerebras';

export const PROVIDER_LABEL: Record<AIProvider, string> = {
  openai: 'OpenAI',
  groq: 'Groq',
  cerebras: 'Cerebras',
};

export function isAIProvider(value: unknown): value is AIProvider {
  return value === 'openai' || value === 'groq' || value === 'cerebras';
}

export function shouldUseOpenAIForFile(file: File): boolean {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
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
