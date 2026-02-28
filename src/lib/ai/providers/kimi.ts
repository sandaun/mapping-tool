// ---------------------------------------------------------------------------
// Kimi (Moonshot) provider — native fetch path
// ---------------------------------------------------------------------------
// Kimi does NOT support JSON Schema / Structured Outputs. It only supports
// `response_format: { type: 'json_object' }`, so we provide JSON examples
// in the prompt and validate with Zod after normalization.

import type { z } from 'zod';
import type { SignalInputType } from '@/types/signal-library';
import { getApiKey } from '../config';
import { extractFileContentForKimi } from '../file-extract';
import { normalizeSignalResponse } from '../normalize';

// ── Constants ───────────────────────────────────────────────────────────────

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';
const KIMI_MODEL = 'kimi-k2-turbo-preview';
const KIMI_MAX_TOKENS = 65536;

// ── JSON format examples (no JSON Schema, just prompt guidance) ─────────────

const KIMI_JSON_EXAMPLES: Record<SignalInputType, string> = {
  modbus: `You MUST return a JSON object with this exact structure. Include EVERY signal from EVERY page/table in the document. Do NOT stop early, do NOT summarize, do NOT skip any rows.

Example of ONE signal entry:
{"deviceId": "METER01", "signalName": "Active Power", "registerType": "HoldingRegister", "address": 100, "dataType": "Int16", "units": "kW", "description": "Total active power", "mode": "R", "factor": 10, "confidence": 0.9}

Full response format:
{"manufacturer": "detected brand or null", "model": "detected model or null", "signals": [... one object per register row ...]}

Field rules:
- registerType: one of "HoldingRegister", "InputRegister", "Coil", "DiscreteInput"
- dataType: one of "Int16", "Uint16", "Int32", "Uint32", "Float32", "Int64", "Uint64"
- mode: one of "R", "W", "R/W", or null
- factor: scaling factor number or null
- confidence: 0.0 to 1.0 (0.9+ if clearly readable, 0.5-0.8 if ambiguous)`,

  bacnet: `You MUST return a JSON object with this exact structure. Include EVERY signal from EVERY page/table in the document. Do NOT stop early, do NOT summarize, do NOT skip any rows.

Example of ONE signal entry:
{"deviceId": "CTRL01", "signalName": "Room Temp", "objectType": "AI", "instance": 1, "units": "°C", "description": "Room temperature sensor", "confidence": 0.9}

Full response format:
{"manufacturer": "detected brand or null", "model": "detected model or null", "signals": [... one object per BACnet object ...]}

Field rules:
- objectType: one of "AI", "AO", "AV", "BI", "BO", "BV", "MSI", "MSO", "MSV"
- instance: integer >= 0
- confidence: 0.0 to 1.0`,

  knx: `You MUST return a JSON object with this exact structure. Include EVERY signal from EVERY page/table in the document. Do NOT stop early, do NOT summarize, do NOT skip any rows.

Example of ONE signal entry:
{"signalName": "Light switch", "groupAddress": "1/1/0", "dpt": "1.001", "description": "Living room light", "confidence": 0.9}

Full response format:
{"manufacturer": "detected brand or null", "model": "detected model or null", "signals": [... one object per group address ...]}

Field rules:
- groupAddress: format "X/X/X" (skip incomplete like "2/-/-")
- dpt: format like "1.001", "9.001" (normalize from DPST-1-1 if needed)
- confidence: 0.0 to 1.0`,
};

const KIMI_CRITICAL_RULES = `CRITICAL RULES:
- You MUST extract EVERY SINGLE signal/register/object from ALL pages and ALL tables in the document.
- Go through the ENTIRE document page by page. Do NOT stop after the first table.
- If the document has 50 signals, return 50. If it has 200, return 200.
- Return ONLY the JSON object, no markdown, no explanation, no extra text.
- Do NOT truncate the signals array. Complete it fully.`;

// ── Public API ──────────────────────────────────────────────────────────────

export async function parseWithKimi(
  file: File,
  inputType: SignalInputType,
  systemPrompt: string,
  schema: z.ZodTypeAny,
): Promise<unknown> {
  const apiKey = getApiKey('kimi');
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY is not configured');
  }

  // Extract file content (PDF via Moonshot file-extract API, others locally)
  const fileContent = await extractFileContentForKimi(file);

  const fullSystemPrompt = [
    systemPrompt,
    KIMI_JSON_EXAMPLES[inputType],
    KIMI_CRITICAL_RULES,
  ].join('\n\n');

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: fullSystemPrompt },
        { role: 'system', content: fileContent },
        {
          role: 'user',
          content: `Extract ALL ${inputType.toUpperCase()} signals from the document "${file.name}". Go through every page and every table. Return the complete JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: KIMI_MAX_TOKENS,
      thinking: { type: 'disabled' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Kimi API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const finishReason = data.choices?.[0]?.finish_reason;

  if (!rawContent) {
    throw new Error('Kimi returned empty response');
  }

  // Parse raw JSON, normalize, then validate with Zod
  const rawJson = JSON.parse(rawContent);
  normalizeSignalResponse(inputType, rawJson);

  const parseResult = schema.safeParse(rawJson);
  if (parseResult.success) {
    logTruncationWarning(finishReason);
    return parseResult.data;
  }

  // Fallback: strip individual signals that failed validation, keep the rest
  return stripInvalidSignals(rawJson, parseResult.error, schema, finishReason);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripInvalidSignals(
  rawJson: Record<string, unknown>,
  error: z.ZodError,
  schema: z.ZodTypeAny,
  finishReason: string | undefined,
): unknown {
  const badIndices = new Set(
    error.issues
      .filter((i) => i.path[0] === 'signals' && typeof i.path[1] === 'number')
      .map((i) => i.path[1] as number),
  );

  if (badIndices.size === 0 || !Array.isArray(rawJson.signals)) {
    throw error;
  }

  const signals = rawJson.signals as unknown[];

  for (const idx of badIndices) {
    console.warn(`Kimi invalid signal[${idx}]:`, JSON.stringify(signals[idx]));
  }

  rawJson.signals = signals.filter(
    (_: unknown, i: number) => !badIndices.has(i),
  );

  console.warn(
    `Stripped ${badIndices.size} invalid signal(s) from Kimi response. ${(rawJson.signals as unknown[]).length} remain.`,
  );

  logTruncationWarning(finishReason);
  return schema.parse(rawJson);
}

function logTruncationWarning(finishReason: string | undefined): void {
  if (finishReason === 'length') {
    console.warn(
      'Kimi response was truncated (finish_reason=length). Some signals may be missing.',
    );
  }
}
