import { extractText } from 'unpdf';
import * as XLSX from 'xlsx';

export interface ExtractedContent {
  type: 'file' | 'text';
  data?: string; // For file: data URI, for text: plain text
  mediaType?: string;
  text?: string; // Alternative for text content
}

/**
 * Extract text content from PDF buffer using unpdf
 * unpdf works in Next.js/serverless without requiring workers
 */
export async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    // unpdf requires Uint8Array
    const uint8Array = new Uint8Array(buffer);
    // Extract text with mergePages to get a single string
    const { text } = await extractText(uint8Array, { mergePages: true });
    return cleanExtractedText(text);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text content from Excel file
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
 * Maximum characters to send to AI (to avoid context limits and parsing errors)
 */
const MAX_TEXT_LENGTH = 100_000; // ~25k tokens for most models

/**
 * Clean up extracted text for AI processing
 */
export function cleanExtractedText(text: string): string {
  let cleaned = text
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .replace(/\s+$/gm, '') // Remove trailing whitespace
    .replace(/^\d+$/gm, '') // Remove lines that are just numbers (likely page numbers)
    .trim();

  // Truncate if too long
  if (cleaned.length > MAX_TEXT_LENGTH) {
    cleaned =
      cleaned.substring(0, MAX_TEXT_LENGTH) +
      '\n\n[... content truncated due to length ...]';
  }

  return cleaned;
}

/**
 * Determine if file needs text extraction based on provider capabilities
 */
export function needsTextExtraction(
  mimeType: string,
  provider: 'openai' | 'groq' | 'cerebras',
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

  // Groq and Cerebras don't support vision, so everything needs text extraction
  // except plain text files which are already text
  const textTypes = ['text/plain', 'text/csv'];
  return !textTypes.includes(mimeType);
}

/**
 * Prepare file content for AI based on provider capabilities
 */
export async function prepareFileForAI(
  file: File,
  provider: 'openai' | 'groq' | 'cerebras',
): Promise<ExtractedContent> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || 'application/octet-stream';

  // Check if we need to extract text
  const requiresExtraction = needsTextExtraction(mimeType, provider);

  if (!requiresExtraction && provider === 'openai') {
    // For OpenAI with native vision support - send as data URI
    const base64 = buffer.toString('base64');
    return {
      type: 'file',
      data: `data:${mimeType};base64,${base64}`,
      mediaType: mimeType,
    };
  }

  // For non-vision providers or text-based files - extract content
  let textContent: string;

  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    textContent = await extractPDFText(buffer);
  } else if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  ) {
    textContent = await extractExcelText(buffer);
  } else {
    // Plain text, CSV, etc.
    const decoder = new TextDecoder('utf-8');
    textContent = decoder.decode(bytes);
  }

  return {
    type: 'text',
    text: textContent,
  };
}

/**
 * Build AI message content based on file type and provider
 * Returns properly typed content for the AI SDK
 */
export async function buildAIMessageContent(
  file: File,
  prompt: string,
  provider: 'openai' | 'groq' | 'cerebras',
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
    // Text-based content (all providers)
    const fullPrompt = `${prompt}

File: ${file.name}
Type: ${file.type || 'unknown'}

--- CONTENT START ---
${content.text}
--- CONTENT END ---`;

    return [{ type: 'text', text: fullPrompt }];
  }
}
