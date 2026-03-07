import type { ParsedData } from '@/lib/import-fields';

// BUG-022: Extract the display value from ExcelJS cell values.
// cell.value can be a primitive, or an object for formulas, rich text, hyperlinks, etc.
function cellToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  const v = value as Record<string, unknown>;
  // Formula cells: { formula: string, result: value }
  if ('result' in v && v.result != null) return cellToString(v.result);
  // Rich text: { richText: [{ text: string }, ...] }
  if ('richText' in v && Array.isArray(v.richText)) {
    return v.richText.map((r: any) => r.text || '').join('');
  }
  // Hyperlinks: { text: string, hyperlink: string }
  if ('text' in v && typeof v.text === 'string') return v.text;
  // Fallback — avoid [object Object]
  return String(value);
}

export async function parseExcel(buffer: ArrayBuffer): Promise<ParsedData> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('No data found in spreadsheet');
  }

  if (worksheet.rowCount > 1001) {
    throw new Error('File has more than 1,000 rows. Please split into smaller files.');
  }

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cellToString(cell.value).trim() || `Column ${colNumber}`;
  });

  const rows: Record<string, string>[] = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const record: Record<string, string> = {};
    let hasData = false;
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header && cell.value != null) {
        record[header] = cellToString(cell.value).trim();
        if (record[header]) hasData = true;
      }
    });
    if (hasData) rows.push(record);
  }

  if (rows.length === 0) {
    throw new Error('No data rows found in spreadsheet');
  }

  return { headers: headers.filter(Boolean), rows };
}
