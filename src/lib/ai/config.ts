// AI Configuration and Model Selection

import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// Model configuration
export type AIModel = 'gpt-4o' | 'gpt-4o-mini';

// Default model - can be overridden via environment variable
export const DEFAULT_MODEL: AIModel = (process.env.AI_MODEL as AIModel) || 'gpt-4o';

// Model descriptions for UI
export const MODEL_INFO: Record<AIModel, { name: string; description: string; costLevel: string }> = {
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Best accuracy for complex PDFs and images. Has vision capabilities.',
    costLevel: 'Higher cost',
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'Good for well-formatted files. 60% cheaper.',
    costLevel: 'Lower cost',
  },
};

// Get the AI model instance
export function getAIModel(model: AIModel = DEFAULT_MODEL): LanguageModel {
  switch (model) {
    case 'gpt-4o-mini':
      return openai('gpt-4o-mini');
    case 'gpt-4o':
    default:
      return openai('gpt-4o');
  }
}

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
  maxFileSizeMB: 10,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
  ],
  allowedExtensions: ['.pdf', '.xlsx', '.xls', '.csv', '.txt', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'],
} as const;

// Check if file type is allowed
export function isAllowedFileType(mimeType: string, extension: string): boolean {
  return (
    UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType as (typeof UPLOAD_CONFIG.allowedMimeTypes)[number]) ||
    UPLOAD_CONFIG.allowedExtensions.includes(extension.toLowerCase() as (typeof UPLOAD_CONFIG.allowedExtensions)[number])
  );
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// AI parsing prompts for each signal type
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
- Do not invent data`,
} as const;

// Confidence level thresholds
export const CONFIDENCE_LEVELS = {
  high: { min: 0.8, label: 'High', color: 'green', emoji: '🟢' },
  medium: { min: 0.6, max: 0.8, label: 'Medium', color: 'yellow', emoji: '🟡' },
  low: { max: 0.6, label: 'Low', color: 'red', emoji: '🔴' },
} as const;

// Get confidence level for a score
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_LEVELS.high.min) return 'high';
  if (score >= CONFIDENCE_LEVELS.medium.min) return 'medium';
  return 'low';
}
