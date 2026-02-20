import { getReadClient, getWriteClient } from '@/lib/supabase/server';
import type { SignalLibraryRecord } from '@/types/signal-library';

/**
 * GET /api/signal-library
 *
 * Query params:
 *   - inputType: 'modbus' | 'bacnet'
 *   - q: search string (matches manufacturer or model)
 *   - limit: max records (default 50)
 *   - manufacturer + model + inputType: exact lookup (returns single record or null)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const inputType = url.searchParams.get('inputType');
    const q = url.searchParams.get('q');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50', 10),
      100,
    );
    const manufacturer = url.searchParams.get('manufacturer');
    const model = url.searchParams.get('model');

    const supabase = getReadClient();

    // Exact lookup mode
    if (manufacturer && model && inputType) {
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

      const { data, error } = await supabase
        .from('signal_library')
        .select('*')
        .eq('manufacturer_norm', norm(manufacturer))
        .eq('model_norm', norm(model))
        .eq('input_type', inputType)
        .maybeSingle();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ record: data as SignalLibraryRecord | null });
    }

    // List mode
    let query = supabase
      .from('signal_library')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (inputType) {
      query = query.eq('input_type', inputType);
    }

    if (q) {
      const norm = q.trim().toLowerCase().replace(/\s+/g, ' ');
      // Escape double-quotes inside the value, then wrap in quotes
      // to prevent PostgREST filter injection via reserved chars (, . : ( ) ")
      const escaped = norm.replace(/"/g, '\\"');
      query = query.or(
        `manufacturer_norm.ilike."%${escaped}%",model_norm.ilike."%${escaped}%"`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      records: data as SignalLibraryRecord[],
      total: count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/signal-library
 *
 * Body (JSON):
 *   - manufacturer, model, inputType, signals (required)
 *   - parserVersion, parserProvider, parserModel, parseWarnings, confidenceStats (optional)
 *   - sourceFileName, sourceFileType, sourceFileSize (optional)
 *   - overwrite (default false)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      manufacturer,
      model,
      inputType,
      signals,
      parserVersion = '1.0',
      parserProvider,
      parserModel,
      parseWarnings = [],
      confidenceStats,
      sourceFileName,
      sourceFileType,
      sourceFileSize,
      overwrite = false,
    } = body;

    // Validate required fields
    if (!manufacturer?.trim()) {
      return Response.json(
        { error: 'manufacturer is required' },
        { status: 400 },
      );
    }
    if (!model?.trim()) {
      return Response.json({ error: 'model is required' }, { status: 400 });
    }
    if (!inputType || !['modbus', 'bacnet', 'knx'].includes(inputType)) {
      return Response.json(
        { error: 'inputType must be modbus, bacnet, or knx' },
        { status: 400 },
      );
    }
    if (!Array.isArray(signals) || signals.length === 0) {
      return Response.json(
        { error: 'signals must be a non-empty array' },
        { status: 400 },
      );
    }

    const supabase = getWriteClient();

    // Check for existing record (use normalized values for lookup)
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

    const { data: existing } = await supabase
      .from('signal_library')
      .select('id')
      .eq('manufacturer_norm', norm(manufacturer))
      .eq('model_norm', norm(model))
      .eq('input_type', inputType)
      .maybeSingle();

    const row = {
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      input_type: inputType,
      signals,
      parser_version: parserVersion,
      parser_provider: parserProvider ?? null,
      parser_model: parserModel ?? null,
      parse_warnings: parseWarnings,
      confidence_stats: confidenceStats ?? null,
      source_file_name: sourceFileName ?? null,
      source_file_type: sourceFileType ?? null,
      source_file_size: sourceFileSize ?? null,
    };

    if (existing) {
      if (!overwrite) {
        return Response.json(
          {
            error:
              'Record already exists for this manufacturer + model + inputType',
            code: 'DUPLICATE',
            existingId: existing.id,
          },
          { status: 409 },
        );
      }

      // Update existing
      const { data, error } = await supabase
        .from('signal_library')
        .update(row)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({
        record: data as SignalLibraryRecord,
        created: false,
      });
    }

    // Insert new
    const { data, error } = await supabase
      .from('signal_library')
      .insert(row)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      record: data as SignalLibraryRecord,
      created: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/signal-library?id=<uuid>
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getWriteClient();
    const { error } = await supabase
      .from('signal_library')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/signal-library
 *
 * Body (JSON): { id, manufacturer?, model? }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, manufacturer, model } = body;

    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (manufacturer?.trim()) updates.manufacturer = manufacturer.trim();
    if (model?.trim()) updates.model = model.trim();

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const supabase = getWriteClient();
    const { data, error } = await supabase
      .from('signal_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ record: data as SignalLibraryRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
