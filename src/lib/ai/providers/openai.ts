// ---------------------------------------------------------------------------
// OpenAI provider — Vercel AI SDK generateObject path
// ---------------------------------------------------------------------------
// OpenAI supports native Structured Outputs via JSON Schema.
// We use the Vercel AI SDK's `generateObject` which enforces schema compliance
// at the API level — the response is guaranteed to match our Zod schema.

import { generateObject } from 'ai';
import type { z } from 'zod';
import { getAIModel } from '../config';
import { buildAIMessageContent } from '../file-extract';

// ── Public API ──────────────────────────────────────────────────────────────

export async function parseWithOpenAI(
  file: File,
  inputType: string,
  systemPrompt: string,
  schema: z.ZodTypeAny,
): Promise<unknown> {
  const model = getAIModel('openai');

  const messageContent = await buildAIMessageContent(
    file,
    `Extract all ${inputType.toUpperCase()} signals from this file: ${file.name}`,
    'openai',
  );

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

  return result.object;
}
