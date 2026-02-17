import { generateObject } from "ai";
import { z } from "zod";
import type { TemplateId } from "@/types/page.types";
import {
  ModbusSignalsResponseSchema,
  BACnetSignalsResponseSchema,
  KNXSignalsResponseSchema,
} from "@/lib/ai/schemas";
import {
  AI_PROMPTS,
  UPLOAD_CONFIG,
  isAllowedFileType,
  getFileExtension,
  getAIModel,
  DEFAULT_PROVIDER,
  type AIProvider,
  supportsVision,
  getApiKey,
  PROVIDER_INFO,
} from "@/lib/ai/config";
import { buildAIMessageContent } from "@/lib/ai/file-extract";

// Map template IDs to input types
const TEMPLATE_INPUT_TYPE: Record<TemplateId, "modbus" | "bacnet" | "knx"> = {
  "bacnet-server__modbus-master": "modbus",
  "knx__modbus-master": "modbus",
  "modbus-slave__bacnet-client": "bacnet",
  "knx__bacnet-client": "bacnet",
  "modbus-slave__knx": "knx",
  "bacnet-server__knx": "knx",
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
    const file = formData.get("file") as File | null;
    const templateId = formData.get("templateId") as TemplateId | null;
    const providerParam =
      (formData.get("provider") as AIProvider) || DEFAULT_PROVIDER;
    const modelParam = formData.get("model") as string | null;

    // Validate required fields
    if (!file) {
      return Response.json(
        { error: "No file provided", code: "MISSING_FILE" },
        { status: 400 },
      );
    }

    if (!templateId) {
      return Response.json(
        { error: "No template selected", code: "MISSING_TEMPLATE" },
        { status: 400 },
      );
    }

    // Hybrid provider strategy:
    // - PDFs → Always OpenAI (has vision, best quality)
    // - Excel/CSV/Text → Use configured provider (Cerebras/Groq for free)
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const finalProvider: AIProvider = isPDF ? "openai" : providerParam;

    // Check API key for final provider
    const apiKey = getApiKey(finalProvider);
    if (!apiKey) {
      const providerName = PROVIDER_INFO[finalProvider].name;
      return Response.json(
        {
          error: isPDF
            ? `PDF files require ${providerName}. Please add ${PROVIDER_INFO[finalProvider].apiKeyName} to .env.local`
            : `${providerName} API key not configured. Please check your environment variables.`,
          code: "MISSING_API_KEY",
          suggestion: isPDF
            ? `Add OPENAI_API_KEY to process PDFs with vision, or convert to Excel/CSV first`
            : undefined,
        },
        { status: 401 },
      );
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return Response.json(
        {
          error: `File too large. Maximum size is ${UPLOAD_CONFIG.maxFileSizeMB}MB.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413 },
      );
    }

    // Validate file type
    const extension = getFileExtension(file.name);
    if (!isAllowedFileType(file.type, extension)) {
      return Response.json(
        {
          error: `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`,
          code: "UNSUPPORTED_FILE_TYPE",
        },
        { status: 400 },
      );
    }

    // Get input type and schema based on template
    const inputType = TEMPLATE_INPUT_TYPE[templateId];
    if (!inputType) {
      return Response.json(
        { error: `Unknown template: ${templateId}`, code: "UNKNOWN_TEMPLATE" },
        { status: 400 },
      );
    }

    const schema = SCHEMAS[inputType];
    const systemPrompt = AI_PROMPTS[inputType];

    // Get AI model using final provider (hybrid strategy applied)
    const model = getAIModel(finalProvider, modelParam || undefined);

    // Build message content based on final provider capabilities and file type
    const messageContent = await buildAIMessageContent(
      file,
      `Extract all ${inputType.toUpperCase()} signals from this file: ${file.name}`,
      finalProvider,
    );

    // Call AI to parse the file
    const result = await generateObject({
      model,
      schema,
      system: systemPrompt,
      messages: [
        {
          role: "user",
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
        "No signals were extracted from the file. The file may not contain parseable signal data.",
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
        provider: finalProvider, // Actual provider used (hybrid strategy)
        requestedProvider: providerParam, // What user requested
        usedTextExtraction: !supportsVision(finalProvider),
        confidenceStats,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown AI parsing error";

    // Log detailed error for debugging
    console.error("AI parsing error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    // AI provider returned content that couldn't be converted to the requested schema
    // (frequent with complex/unstructured files on non-vision providers)
    if (
      error instanceof Error &&
      (error.name === "NoObjectGeneratedError" ||
        errorMessage.includes("No object generated") ||
        errorMessage.includes("could not generate") ||
        errorMessage.includes("schema"))
    ) {
      return Response.json(
        {
          error:
            "The AI could not return a valid structured result for this file. Try with OpenAI or simplify the input file.",
          code: "UNSTRUCTURED_AI_OUTPUT",
          message: errorMessage,
        },
        { status: 422 },
      );
    }

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error:
            "AI response validation failed. The AI returned invalid data format.",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 422 },
      );
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return Response.json(
        {
          error: "AI parsing timed out. The file may be too large or complex.",
          code: "TIMEOUT",
        },
        { status: 504 },
      );
    }

    // Check for API key issues
    if (
      error instanceof Error &&
      (errorMessage.includes("API key") || errorMessage.includes("401"))
    ) {
      return Response.json(
        {
          error:
            "API key is invalid or missing. Please check your configuration.",
          code: "AUTH_ERROR",
          message: errorMessage,
        },
        { status: 401 },
      );
    }

    return Response.json(
      {
        error:
          "Failed to parse file with AI. Please try again or use manual CSV input.",
        code: "AI_ERROR",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

// Handle GET requests (health check)
export async function GET() {
  return Response.json({
    status: "ok",
    message: "AI file parsing endpoint is ready",
    supportedProviders: ["openai", "groq", "cerebras"],
    currentProvider: DEFAULT_PROVIDER,
    supportsVision: supportsVision(),
    maxFileSize: UPLOAD_CONFIG.maxFileSizeMB,
  });
}
