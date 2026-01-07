import { rawToXlsxBuffer, type RawWorkbook } from '@/lib/excel/raw';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const raw = (await request.json()) as RawWorkbook;

  // MVP: validació mínima (shape). La validació amb Zod la farem quan toqui.
  if (!raw || !Array.isArray(raw.sheets)) {
    return new Response(JSON.stringify({ error: 'Payload invàlid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const buffer = rawToXlsxBuffer(raw);
  const body = new Uint8Array(buffer);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="export.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
