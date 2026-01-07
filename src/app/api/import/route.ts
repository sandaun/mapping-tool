import { NextResponse } from 'next/server';

import { ExcelContractError, workbookArrayBufferToRaw } from '@/lib/excel/raw';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Camp 'file' requerit (multipart/form-data)." },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const raw = workbookArrayBufferToRaw(arrayBuffer);
    return NextResponse.json(raw);
  } catch (error) {
    if (error instanceof ExcelContractError) {
      return NextResponse.json(
        { error: error.message, missingSheets: error.missingSheets },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { error: `No s'ha pogut importar l'Excel: ${message}` },
      { status: 500 }
    );
  }
}
