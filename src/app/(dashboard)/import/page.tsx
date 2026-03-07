'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Check, AlertTriangle } from 'lucide-react';

interface CSVRow {
  [key: string]: string;
}

const FIELD_MAPPINGS: { target: string; label: string; aliases: string[] }[] = [
  { target: 'first_name', label: 'First Name', aliases: ['first name', 'first', 'fname', 'first_name'] },
  { target: 'last_name', label: 'Last Name', aliases: ['last name', 'last', 'lname', 'last_name', 'surname'] },
  { target: 'phone', label: 'Phone', aliases: ['phone', 'telephone', 'cell', 'mobile', 'phone number', 'phone_number'] },
  { target: 'email', label: 'Email', aliases: ['email', 'e-mail', 'email address', 'email_address'] },
  { target: 'address', label: 'Address', aliases: ['address', 'street', 'location'] },
  { target: 'relationship_notes', label: 'Notes', aliases: ['notes', 'note', 'comments', 'relationship_notes', 'memo'] },
];

export default function ImportPage() {
  const { createContact } = useStore();
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const hdrs = results.meta.fields || [];
        setRows(data);
        setHeaders(hdrs);
        setResult(null);

        // Auto-map columns
        const autoMap: Record<string, string> = {};
        for (const field of FIELD_MAPPINGS) {
          for (const header of hdrs) {
            if (field.aliases.includes(header.toLowerCase().trim())) {
              autoMap[field.target] = header;
              break;
            }
          }
        }
        setMappings(autoMap);
      },
    });
  }

  async function handleImport() {
    if (!mappings.first_name) return;
    setImporting(true);
    let imported = 0;
    let errors = 0;

    // Build all valid contacts first
    const validContacts: Record<string, string>[] = [];
    for (const row of rows) {
      const contact: Record<string, string> = {};
      for (const [target, source] of Object.entries(mappings)) {
        if (source && row[source]) {
          contact[target] = row[source].trim();
        }
      }
      if (!contact.first_name) { errors++; continue; }
      validContacts.push(contact);
    }

    // Batch insert via Supabase (bypasses store's one-at-a-time insert)
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const org = useStore.getState().org;
    if (!org) { setImporting(false); return; }

    const BATCH_SIZE = 50;
    for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
      const batch = validContacts.slice(i, i + BATCH_SIZE).map(c => ({ ...c, org_id: org.id }));
      const { error } = await supabase.from('contacts').insert(batch);
      if (error) { errors += batch.length; } else { imported += batch.length; }
    }

    // Refresh contacts in store
    useStore.getState().fetchContacts();

    setResult({ imported, errors });
    setImporting(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-stone-900">Import Contacts</h1>
        <p className="text-sm text-stone-500 mt-0.5">Upload a CSV file to import contacts in bulk</p>
      </div>

      {!rows.length ? (
        <label className="block border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-stone-400 transition-colors bg-white">
          <Upload className="w-8 h-8 mx-auto mb-3 text-stone-400" />
          <p className="text-sm font-medium text-stone-600">Click to upload CSV</p>
          <p className="text-xs text-stone-400 mt-1">Supports .csv files up to 500 rows</p>
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>
      ) : result ? (
        <div className="bg-white border border-stone-200 rounded-lg p-6 text-center">
          <Check className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-medium text-stone-900">Import Complete</p>
          <p className="text-sm text-stone-500 mt-1">
            {result.imported} contacts imported
            {result.errors > 0 && `, ${result.errors} skipped`}
          </p>
          <button
            onClick={() => { setRows([]); setHeaders([]); setMappings({}); setResult(null); }}
            className="mt-4 px-4 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800"
          >
            Import Another
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{rows.length} rows found &middot; {headers.length} columns</span>
          </div>

          {/* Column mapping */}
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Map Columns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {FIELD_MAPPINGS.map(field => (
                <div key={field.target} className="flex items-center gap-2">
                  <label className="text-xs text-stone-500 w-24 flex-shrink-0">
                    {field.label} {field.target === 'first_name' && '*'}
                  </label>
                  <select
                    value={mappings[field.target] || ''}
                    onChange={(e) => setMappings({ ...mappings, [field.target]: e.target.value })}
                    className="flex-1 px-2 py-1 border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="">— skip —</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Preview (first 3 rows)</h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-stone-50">
                    {FIELD_MAPPINGS.filter(f => mappings[f.target]).map(f => (
                      <th key={f.target} className="px-2 py-1 text-left text-stone-500">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t border-stone-100">
                      {FIELD_MAPPINGS.filter(f => mappings[f.target]).map(f => (
                        <td key={f.target} className="px-2 py-1 text-stone-600">
                          {row[mappings[f.target]] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!mappings.first_name && (
            <div className="flex items-center gap-2 text-amber-600 text-xs">
              <AlertTriangle className="w-4 h-4" />
              Map at least the First Name column to continue
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing || !mappings.first_name}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {importing ? `Importing... (${rows.length} rows)` : `Import ${rows.length} Contacts`}
            </button>
            <button
              onClick={() => { setRows([]); setHeaders([]); setMappings({}); }}
              className="px-4 py-2 text-stone-500 text-sm hover:text-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
