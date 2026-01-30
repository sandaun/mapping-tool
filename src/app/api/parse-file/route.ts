import { generateObject } from 'ai';
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
  getAIModel,
  type AIModel,
} from '@/lib/ai/config';

// Map template IDs to input types
const TEMPLATE_INPUT_TYPE: Record<TemplateId, 'modbus' | 'bacnet' | 'knx'> = {
  'bacnet-server__modbus-master': 'modbus',
  'knx__modbus-master': 'modbus',
  'modbus-slave__bacnet-client': 'bacnet',
  'knx__bacnet-client': 'bacnet',
  'modbus-slave__knx': 'knx',
  'bacnet-server__knx': 'knx',
};

// Map input types to schemas
const SCHEMAS = {
  modbus: ModbusSignalsResponseSchema,
  bacnet: BACnetSignalsResponseSchema,
  knx: KNXSignalsResponseSchema,
};

export async function POST(request: Request) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const templateId = formData.get('templateId') as TemplateId | null;
    const modelParam = formData.get('model') as AIModel | null;

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

    // Get input type and schema based on template
    const inputType = TEMPLATE_INPUT_TYPE[templateId];
    if (!inputType) {
      return Response.json(
        { error: `Unknown template: ${templateId}`, code: 'UNKNOWN_TEMPLATE' },
        { status: 400 },
      );
    }

    const schema = SCHEMAS[inputType];
    const systemPrompt = AI_PROMPTS[inputType];

    // Read file content
    const bytes = await file.arrayBuffer();
    const mimeType = file.type || 'application/octet-stream';

    // Determine if this is a file type that OpenAI supports natively
    const nativeFileTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];

    // Get AI model (use provided or default)
    const model = getAIModel(modelParam || undefined);

    // Build message content based on file type
    type MessageContent = Array<
      | { type: 'text'; text: string }
      | { type: 'file'; data: string; mediaType: string }
    >;

    let messageContent: MessageContent;

    if (nativeFileTypes.includes(mimeType)) {
      // For PDFs and images, send as file attachment
      const base64 = Buffer.from(bytes).toString('base64');
      messageContent = [
        {
          type: 'text',
          text: `Extract all ${inputType.toUpperCase()} signals from this file: ${file.name}`,
        },
        {
          type: 'file',
          data: `data:${mimeType};base64,${base64}`,
          mediaType: mimeType,
        },
      ];
    } else {
      // For text-based files (CSV, TXT, Excel), extract content as text
      let textContent: string;

      if (
        mimeType.includes('spreadsheet') ||
        mimeType.includes('excel') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      ) {
        // For Excel files, we need to use xlsx library to extract text
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheetsText = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          return `=== Sheet: ${name} ===\n${csv}`;
        }).join('\n\n');
        textContent = sheetsText;
      } else {
        // For plain text, CSV, etc., decode as UTF-8
        const decoder = new TextDecoder('utf-8');
        textContent = decoder.decode(bytes);
      }

      messageContent = [
        {
          type: 'text',
          text: `Extract all ${inputType.toUpperCase()} signals from this document content.

File name: ${file.name}
File type: ${mimeType}

--- DOCUMENT CONTENT START ---
${textContent}
--- DOCUMENT CONTENT END ---`,
        },
      ];
    }

    // Call AI to parse the file
    const result = await generateObject({
      model,
      schema,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      maxRetries: 2,
    });

    // Process results
    const signals = result.object.signals || [];
    const warnings: string[] = [];

    // Check for low confidence signals
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

    // Calculate confidence stats
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
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        signalsFound: signals.length,
        templateId,
        inputType,
        confidenceStats,
      },
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('AI parsing error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    // Handle specific error types
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

    // Check for API key issues
    if (
      error instanceof Error &&
      (error.message.includes('API key') || error.message.includes('401'))
    ) {
      return Response.json(
        {
          error:
            'OpenAI API key is invalid or missing. Please check your configuration.',
          code: 'AUTH_ERROR',
          message: error.message,
        },
        { status: 401 },
      );
    }

    return Response.json(
      {
        error:
          'Failed to parse file with AI. Please try again or use manual CSV input.',
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Handle GET requests (health check)
export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'AI file parsing endpoint is ready',
    supportedModels: ['gpt-4o', 'gpt-4o-mini'],
    maxFileSize: UPLOAD_CONFIG.maxFileSizeMB,
  });
}
