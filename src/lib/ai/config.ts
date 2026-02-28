// ---------------------------------------------------------------------------
// AI Configuration — single source of truth
// ---------------------------------------------------------------------------
// Providers: OpenAI (vision + structured output), Kimi (file-extract + 256K ctx)
//
// To switch providers, change ACTIVE_AI_PROVIDER below. That's it.

import { openai, createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { AIProvider } from '@/lib/ai-providers';

// Re-export so consumers can import from either location
export type { AIProvider };

// ── Active provider ─────────────────────────────────────────────────────────
// CHANGE THIS VALUE TO SWITCH: 'openai' or 'kimi'
export const ACTIVE_AI_PROVIDER: AIProvider = 'openai';

// ── Provider metadata ───────────────────────────────────────────────────────

export const PROVIDER_INFO: Record<
  AIProvider,
  {
    name: string;
    description: string;
    supportsVision: boolean;
    apiKeyName: string;
  }
> = {
  openai: {
    name: 'OpenAI',
    description: 'Best accuracy. Supports PDFs/images directly via vision.',
    supportsVision: true,
    apiKeyName: 'OPENAI_API_KEY',
  },
  kimi: {
    name: 'Kimi (Moonshot)',
    description:
      'Supports PDFs via file-extract API. 256K context. OpenAI-compatible.',
    supportsVision: false,
    apiKeyName: 'MOONSHOT_API_KEY',
  },
};

// ── Kimi SDK instance (OpenAI-compatible) ───────────────────────────────────

const kimiClient = createOpenAI({
  baseURL: 'https://api.moonshot.ai/v1',
  apiKey: process.env.MOONSHOT_API_KEY ?? '',
  name: 'kimi',
});

// ── Default models ──────────────────────────────────────────────────────────

const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  kimi: 'kimi-k2.5',
};

// ── Provider functions ──────────────────────────────────────────────────────

export function getAIModel(
  provider: AIProvider = ACTIVE_AI_PROVIDER,
  model?: string,
): LanguageModel {
  const modelToUse = model || PROVIDER_DEFAULT_MODELS[provider];

  switch (provider) {
    case 'kimi':
      return kimiClient.chat(modelToUse);
    case 'openai':
    default:
      return openai(modelToUse);
  }
}

export function supportsVision(
  provider: AIProvider = ACTIVE_AI_PROVIDER,
): boolean {
  return PROVIDER_INFO[provider].supportsVision;
}

export function getApiKey(
  provider: AIProvider = ACTIVE_AI_PROVIDER,
): string | undefined {
  switch (provider) {
    case 'kimi':
      return process.env.MOONSHOT_API_KEY;
    case 'openai':
    default:
      return process.env.OPENAI_API_KEY;
  }
}

// ── File upload config ──────────────────────────────────────────────────────

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileSizeMB: 10,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'text/html',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
  ],
  allowedExtensions: [
    '.pdf',
    '.xlsx',
    '.xls',
    '.csv',
    '.txt',
    '.html',
    '.doc',
    '.docx',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
  ],
} as const;

export function isAllowedFileType(
  mimeType: string,
  extension: string,
): boolean {
  return (
    UPLOAD_CONFIG.allowedMimeTypes.includes(
      mimeType as (typeof UPLOAD_CONFIG.allowedMimeTypes)[number],
    ) ||
    UPLOAD_CONFIG.allowedExtensions.includes(
      extension.toLowerCase() as (typeof UPLOAD_CONFIG.allowedExtensions)[number],
    )
  );
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// ── AI prompts per signal type ──────────────────────────────────────────────

export const AI_PROMPTS = {
  modbus: `You are a building automation engineer extracting Modbus signals from device documentation.

Extract ALL Modbus register signals from the provided document.
Look for register maps, signal tables, or device communication documentation.

For each signal, extract:
- deviceId: Create a logical device ID based on the document
- signalName: The signal name as shown in the documentation
- registerType: HoldingRegister, InputRegister, Coil, or DiscreteInput
- address: Modbus register address (integer)
- dataType: Normalize to Int16, Uint16, Int32, Uint32, or Float32
- units: Engineering units if shown
- description: Full description if available
- mode: R, W, or R/W if indicated
- factor: Scaling factor if mentioned

IMPORTANT:
- Extract ALL signals found in the document
- Use confidence scores: high (>0.8), medium (0.6-0.8), low (<0.6)
- Also detect manufacturer/brand and model/reference when clearly present
- Do not invent data`,

  bacnet: `You are a building automation engineer extracting BACnet signals from device documentation.

Extract ALL BACnet object signals from the provided document.
Look for object lists, point lists, or device communication documentation.

For each signal, extract:
- deviceId: Create a logical device ID based on the document
- signalName: The signal name as shown in the documentation
- objectType: AI, AO, AV, BI, BO, BV, MSI, MSO, or MSV
- instance: BACnet object instance number
- units: Engineering units if shown
- description: Full description if available

IMPORTANT:
- Extract ALL signals found in the document
- Use confidence scores: high (>0.8), medium (0.6-0.8), low (<0.6)
- Also detect manufacturer/brand and model/reference when clearly present
- Do not invent data`,

  knx: `You are a building automation engineer extracting KNX signals from ETS exports or documentation.

Extract ALL KNX group address signals from the provided document.

For each signal, extract:
- signalName: The signal name/description
- groupAddress: KNX group address in format "X/X/X"
- dpt: Data Point Type (e.g., "1.001", "9.001")
- description: Full hierarchical path if available

IMPORTANT:
- Skip entries with incomplete addresses like "2/-/-"
- Use confidence scores: high (>0.8), medium (0.6-0.8), low (<0.6)
- Also detect manufacturer/brand and model/reference when clearly present
- Do not invent data`,
} as const;

// ── Confidence levels ───────────────────────────────────────────────────────

export const CONFIDENCE_LEVELS = {
  high: { min: 0.8, label: 'High', color: 'green' },
  medium: { min: 0.6, max: 0.8, label: 'Medium', color: 'yellow' },
  low: { max: 0.6, label: 'Low', color: 'red' },
} as const;

export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_LEVELS.high.min) return 'high';
  if (score >= CONFIDENCE_LEVELS.medium.min) return 'medium';
  return 'low';
}
