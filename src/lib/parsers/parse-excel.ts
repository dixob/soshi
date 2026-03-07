import type { ParsedData } from '@/lib/import-fields';

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
    headers[colNumber - 1] = String(cell.value || `Column ${colNumber}`).trim();
  });

  const rows: Record<string, string>[] = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const record: Record<string, string> = {};
    let hasData = false;
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header && cell.value != null) {
        record[header] = String(cell.value).trim();
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
