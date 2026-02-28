import * as XLSX from 'xlsx';
import type { AIProvider } from './config';

/**
 * Upload a file to Kimi's file-extract API and retrieve extracted text.
 * Uses the OpenAI-compatible /v1/files endpoint at api.moonshot.ai.
 */
export async function extractTextViaKimi(file: File): Promise<string> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY is not configured');
  }

  // Step 1: Upload file to Kimi
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('purpose', 'file-extract');

  const uploadRes = await fetch('https://api.moonshot.ai/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Kimi file upload failed (${uploadRes.status}): ${err}`);
  }

  const fileObject = (await uploadRes.json()) as { id: string; status: string };

  // Step 2: Retrieve extracted content
  const contentRes = await fetch(
    `https://api.moonshot.ai/v1/files/${encodeURIComponent(fileObject.id)}/content`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  );

  if (!contentRes.ok) {
    const err = await contentRes.text();
    throw new Error(
      `Kimi content retrieval failed (${contentRes.status}): ${err}`,
    );
  }

  const text = await contentRes.text();

  // Step 3: Clean up — delete the file from Kimi (best-effort)
  fetch(
    `https://api.moonshot.ai/v1/files/${encodeURIComponent(fileObject.id)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  ).catch(() => {
    /* ignore cleanup errors */
  });

  return text;
}

/**
 * Extract raw file content for Kimi without any truncation or cleaning.
 * PDFs use Kimi's file-extract API; Excel/CSV/text are extracted locally.
 */
export async function extractFileContentForKimi(file: File): Promise<string> {
  const mimeType = file.type || 'application/octet-stream';

  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractTextViaKimi(file);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  ) {
    return extractExcelText(buffer);
  }

  // Plain text, CSV, HTML, etc.
  return new TextDecoder('utf-8').decode(bytes);
}

export interface ExtractedContent {
  type: 'file' | 'text';
  data?: string; // For file: data URI, for text: plain text
  mediaType?: string;
  text?: string;
}

/**
 * Extract text content from Excel file.
 */
export async function extractExcelText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetsText = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `=== Sheet: ${name} ===\n${csv}`;
    }).join('\n\n');
    return sheetsText;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error('Failed to extract text from Excel');
  }
}

/**
 * Maximum characters to send to AI (to avoid context limits).
 */
const MAX_TEXT_LENGTH = 100_000; // ~25k tokens

/**
 * Clean up extracted text for AI processing.
 */
export function cleanExtractedText(text: string): string {
  let cleaned = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
    .replace(/^\d+$/gm, '')
    .trim();

  if (cleaned.length > MAX_TEXT_LENGTH) {
    cleaned =
      cleaned.substring(0, MAX_TEXT_LENGTH) +
      '\n\n[... content truncated due to length ...]';
  }

  return cleaned;
}

/**
 * Determine if file needs text extraction based on provider capabilities.
 */
export function needsTextExtraction(
  mimeType: string,
  provider: AIProvider,
): boolean {
  // OpenAI supports vision for PDFs and images
  if (provider === 'openai') {
    const nativeFileTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];
    return !nativeFileTypes.includes(mimeType);
  }

  // Kimi: PDF handled server-side via file-extract, text/CSV already text
  if (provider === 'kimi') {
    const kimiNativeTypes = ['application/pdf', 'text/plain', 'text/csv'];
    return !kimiNativeTypes.includes(mimeType) && !mimeType.includes('pdf');
  }

  // Fallback: everything needs extraction
  return true;
}

/**
 * Prepare file content for AI based on provider capabilities.
 */
export async function prepareFileForAI(
  file: File,
  provider: AIProvider,
): Promise<ExtractedContent> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || 'application/octet-stream';

  const requiresExtraction = needsTextExtraction(mimeType, provider);

  if (!requiresExtraction && provider === 'openai') {
    // OpenAI with native vision support — send as data URI
    const base64 = buffer.toString('base64');
    return {
      type: 'file',
      data: `data:${mimeType};base64,${base64}`,
      mediaType: mimeType,
    };
  }

  // Text-based: extract content locally
  let textContent: string;

  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    if (provider === 'kimi') {
      const extracted = await extractTextViaKimi(file);
      return { type: 'text', text: extracted };
    }
    throw new Error(
      'PDF text extraction attempted but PDFs should use OpenAI vision or Kimi file-extract. This is a routing error.',
    );
  } else if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  ) {
    textContent = await extractExcelText(buffer);
  } else {
    const decoder = new TextDecoder('utf-8');
    textContent = decoder.decode(bytes);
  }

  return { type: 'text', text: textContent };
}

/**
 * Build AI message content based on file type and provider.
 * Returns properly typed content for the AI SDK.
 */
export async function buildAIMessageContent(
  file: File,
  prompt: string,
  provider: AIProvider,
): Promise<
  Array<
    | { type: 'text'; text: string }
    | { type: 'file'; data: string; mediaType: string }
  >
> {
  const content = await prepareFileForAI(file, provider);

  if (content.type === 'file' && content.data && content.mediaType) {
    // File-based content (OpenAI vision)
    return [
      { type: 'text', text: prompt },
      { type: 'file', data: content.data, mediaType: content.mediaType },
    ];
  } else {
    // Text-based content
    const cleanedText = cleanExtractedText(content.text ?? '');
    const fullPrompt = `${prompt}

File: ${file.name}
Type: ${file.type || 'unknown'}

--- CONTENT START ---
${cleanedText}
--- CONTENT END ---`;

    return [{ type: 'text', text: fullPrompt }];
  }
}
