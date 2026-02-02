import { rawToXlsxBuffer, type RawWorkbook } from '@/lib/excel/raw';

export const runtime = 'nodejs';

function isRawWorkbook(value: unknown): value is RawWorkbook {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sheets' in value &&
    Array.isArray(value.sheets)
  );
}

export async function POST(request: Request) {
  const data: unknown = await request.json();

  if (!isRawWorkbook(data)) {
    return new Response(JSON.stringify({ error: 'Payload invàlid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For IBMAPS export, rows already contains metadata + header + data
  // So we don't add headers again
  const buffer = rawToXlsxBuffer(data, false);
  const body = new Uint8Array(buffer);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="export.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
