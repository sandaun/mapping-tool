// ---------------------------------------------------------------------------
// POST /api/parse-file — AI signal extraction endpoint
// ---------------------------------------------------------------------------
// Thin orchestrator: validates input → delegates to provider → returns result.
// All provider-specific logic lives in src/lib/ai/providers/*.

import { z } from 'zod';
import type { TemplateId } from '@/types/page.types';
import {
  ModbusSignalsResponseSchema,
  BACnetSignalsResponseSchema,
  KNXSignalsResponseSchema,
} from '@/lib/ai/schemas';
import {
  AI_PROMPTS,
  UPLOAD_CONFIG,
  isAllowedFileType,
  getFileExtension,
  ACTIVE_AI_PROVIDER,
  type AIProvider,
  supportsVision,
  getApiKey,
  PROVIDER_INFO,
} from '@/lib/ai/config';
import { TEMPLATE_INPUT_TYPE } from '@/lib/ai-providers';
import { parseWithKimi } from '@/lib/ai/providers/kimi';
import { parseWithOpenAI } from '@/lib/ai/providers/openai';
import type { SignalInputType } from '@/types/signal-library';

// ── Schema registry ─────────────────────────────────────────────────────────

const SCHEMAS: Record<SignalInputType, z.ZodTypeAny> = {
  modbus: ModbusSignalsResponseSchema,
  bacnet: BACnetSignalsResponseSchema,
  knx: KNXSignalsResponseSchema,
};

// ── PDF-capable providers ───────────────────────────────────────────────────

const PDF_CAPABLE_PROVIDERS: AIProvider[] = ['openai', 'kimi'];

function resolveProvider(isPDF: boolean): AIProvider {
  const provider = ACTIVE_AI_PROVIDER;
  if (isPDF && !PDF_CAPABLE_PROVIDERS.includes(provider)) {
    return 'openai'; // Fallback for PDFs on non-vision providers
  }
  return provider;
}

// ── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const templateId = formData.get('templateId') as TemplateId | null;

    // Validate required fields
    if (!file) {
      return Response.json(
        { error: 'No file provided', code: 'MISSING_FILE' },
        { status: 400 },
      );
    }

    if (!templateId) {
      return Response.json(
        { error: 'No template selected', code: 'MISSING_TEMPLATE' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return Response.json(
        {
          error: `File too large. Maximum size is ${UPLOAD_CONFIG.maxFileSizeMB}MB.`,
          code: 'FILE_TOO_LARGE',
        },
        { status: 413 },
      );
    }

    // Validate file type
    const extension = getFileExtension(file.name);
    if (!isAllowedFileType(file.type, extension)) {
      return Response.json(
        {
          error: `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
          code: 'UNSUPPORTED_FILE_TYPE',
        },
        { status: 400 },
      );
    }

    // Resolve input type
    const inputType = TEMPLATE_INPUT_TYPE[templateId];
    if (!inputType) {
      return Response.json(
        { error: `Unknown template: ${templateId}`, code: 'UNKNOWN_TEMPLATE' },
        { status: 400 },
      );
    }

    // Resolve provider (with PDF fallback)
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const provider = resolveProvider(isPDF);

    // Check API key
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      const info = PROVIDER_INFO[provider];
      return Response.json(
        {
          error: isPDF
            ? `PDF files require ${info.name}. Please add ${info.apiKeyName} to .env.local`
            : `${info.name} API key not configured. Please check your environment variables.`,
          code: 'MISSING_API_KEY',
        },
        { status: 401 },
      );
    }

    // Delegate to provider
    const schema = SCHEMAS[inputType];
    const systemPrompt = AI_PROMPTS[inputType];

    // Both providers return { signals, manufacturer, model } validated by Zod
    const parsedObject = (
      provider === 'kimi'
        ? await parseWithKimi(file, inputType, systemPrompt, schema)
        : await parseWithOpenAI(file, inputType, systemPrompt, schema)
    ) as {
      signals: Array<{ confidence: number; [key: string]: unknown }>;
      manufacturer?: string | null;
      model?: string | null;
    };

    // Process results
    const signals = parsedObject.signals || [];
    const warnings: string[] = [];

    const lowConfidenceSignals = signals.filter(
      (s: { confidence: number }) => s.confidence < 0.6,
    );
    if (lowConfidenceSignals.length > 0) {
      warnings.push(
        `${lowConfidenceSignals.length} signal(s) have low confidence and may need review.`,
      );
    }

    if (signals.length === 0) {
      warnings.push(
        'No signals were extracted from the file. The file may not contain parseable signal data.',
      );
    }

    const confidenceStats = {
      high: signals.filter((s: { confidence: number }) => s.confidence >= 0.8)
        .length,
      medium: signals.filter(
        (s: { confidence: number }) =>
          s.confidence >= 0.6 && s.confidence < 0.8,
      ).length,
      low: signals.filter((s: { confidence: number }) => s.confidence < 0.6)
        .length,
    };

    return Response.json({
      signals,
      warnings,
      manufacturer: parsedObject.manufacturer ?? null,
      model: parsedObject.model ?? null,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        signalsFound: signals.length,
        templateId,
        inputType,
        provider,
        usedTextExtraction: !supportsVision(provider),
        confidenceStats,
      },
    });
  } catch (error) {
    return handleParseError(error);
  }
}

// ── GET handler (health check) ──────────────────────────────────────────────

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'AI file parsing endpoint is ready',
    supportedProviders: ['openai', 'kimi'],
    currentProvider: ACTIVE_AI_PROVIDER,
    supportsVision: supportsVision(),
    maxFileSize: UPLOAD_CONFIG.maxFileSizeMB,
  });
}

// ── Error handling ──────────────────────────────────────────────────────────

function handleParseError(error: unknown): Response {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown AI parsing error';

  console.error('AI parsing error:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (
    error instanceof Error &&
    (error.name === 'NoObjectGeneratedError' ||
      errorMessage.includes('No object generated') ||
      errorMessage.includes('could not generate') ||
      errorMessage.includes('schema'))
  ) {
    return Response.json(
      {
        error:
          'The AI could not return a valid structured result for this file. Try with OpenAI or simplify the input file.',
        code: 'UNSTRUCTURED_AI_OUTPUT',
        message: errorMessage,
      },
      { status: 422 },
    );
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error:
          'AI response validation failed. The AI returned invalid data format.',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 422 },
    );
  }

  if (error instanceof Error && error.message.includes('timeout')) {
    return Response.json(
      {
        error: 'AI parsing timed out. The file may be too large or complex.',
        code: 'TIMEOUT',
      },
      { status: 504 },
    );
  }

  if (
    error instanceof Error &&
    (errorMessage.includes('API key') || errorMessage.includes('401'))
  ) {
    return Response.json(
      {
        error:
          'API key is invalid or missing. Please check your configuration.',
        code: 'AUTH_ERROR',
        message: errorMessage,
      },
      { status: 401 },
    );
  }

  return Response.json(
    {
      error:
        'Failed to parse file with AI. Please try again or use manual CSV input.',
      code: 'AI_ERROR',
      message: errorMessage,
    },
    { status: 500 },
  );
}
