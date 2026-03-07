import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { parseExcel } from '@/lib/parsers/parse-excel';
import { parsePdf } from '@/lib/parsers/parse-pdf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = arrayBuffer;

  // Detect file type
  let fileType: string;
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Use file-type for magic byte detection, fall back to extension
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(buffer);
    if (detected?.mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      fileType = 'xlsx';
    } else if (detected?.mime === 'application/pdf') {
      fileType = 'pdf';
    } else if (ext === 'xlsx' || ext === 'pdf') {
      fileType = ext;
    } else {
      return NextResponse.json(
        { error: `Unsupported file type. Please upload an Excel (.xlsx) or PDF file.` },
        { status: 400 }
      );
    }
  } catch {
    // Fall back to extension
    if (ext === 'xlsx') fileType = 'xlsx';
    else if (ext === 'pdf') fileType = 'pdf';
    else {
      return NextResponse.json({ error: 'Could not determine file type' }, { status: 400 });
    }
  }

  try {
    let result;
    if (fileType === 'xlsx') {
      result = await parseExcel(buffer);
    } else {
      result = await parsePdf(buffer);
    }

    return NextResponse.json({
      ...result,
      fileType,
      rowCount: result.rows.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
