'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import Papa from 'papaparse';
import { FIELD_MAPPINGS, autoMapColumns } from '@/lib/import-fields';
import type { ParsedData } from '@/lib/import-fields';
import { Upload, Camera, Download, FileSpreadsheet, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Stage = 'hub' | 'parsing' | 'mapping' | 'importing' | 'done';

export default function ImportPage() {
  const { createContact } = useStore();
  const [stage, setStage] = useState<Stage>('hub');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function reset() {
    setStage('hub');
    setRows([]);
    setHeaders([]);
    setMappings({});
    setResult(null);
    setError(null);
  }

  function applyParsedData(data: ParsedData) {
    setHeaders(data.headers);
    setRows(data.rows);
    setMappings(autoMapColumns(data.headers));
    setStage('mapping');
  }

  function handleCSV(file: File) {
    setStage('parsing');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        // BUG-040: Enforce same 1000-row limit as Excel parser
        if (data.length > 1000) {
          setError('File has more than 1,000 rows. Please split into smaller files.');
          setStage('hub');
          return;
        }
        const hdrs = results.meta.fields || [];
        applyParsedData({ headers: hdrs, rows: data });
      },
      error: () => {
        setError('Failed to parse CSV file. Please check the format.');
        setStage('hub');
      },
    });
  }

  async function handleServerParse(file: File) {
    setStage('parsing');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-file', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to parse file' }));
        throw new Error(err.error || 'Failed to parse file');
      }
      const data: ParsedData & { fileType: string; rowCount: number } = await res.json();
      applyParsedData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setStage('hub');
    }
  }

  function handleFile(file: File) {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      handleCSV(file);
    } else if (ext === 'xlsx' || ext === 'pdf') {
      handleServerParse(file);
    } else {
      setError(`Unsupported file type: .${ext}. Please upload a CSV, Excel (.xlsx), or PDF file.`);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  // BUG-026: Remove empty deps — handleFile reference changes, causing stale closure
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // BUG-036: Guard against double-click — check stage before proceeding
  async function handleImport() {
    if (!mappings.first_name || stage === 'importing') return;
    setStage('importing');
    let imported = 0;
    let errors = 0;

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

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const org = useStore.getState().org;
    if (!org) { setStage('mapping'); return; }

    // BUG-009: Insert individually so one bad row doesn't fail the whole batch
    for (const c of validContacts) {
      const { error } = await supabase.from('contacts').insert({ ...c, org_id: org.id });
      if (error) { errors++; } else { imported++; }
    }

    useStore.getState().fetchContacts();
    setResult({ imported, errors });
    setStage('done');
  }

  // --- Hub view ---
  if (stage === 'hub') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-stone-900">Import Contacts</h1>
          <p className="text-sm text-stone-500 mt-0.5">Add contacts from files, photos, or a template</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upload file */}
          <label
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-white ${
              dragOver ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-600">Upload File</p>
            <p className="text-xs text-stone-400 mt-1">CSV, Excel, or PDF</p>
            <p className="text-xs text-stone-400">Drag & drop or click to browse</p>
            <input type="file" accept=".csv,.xlsx,.pdf" onChange={handleFileInput} className="hidden" />
          </label>

          {/* Scan a card */}
          <Link
            href="/import/scan"
            className="block border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-stone-400 transition-colors bg-white"
          >
            <Camera className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-600">Scan a Card</p>
            <p className="text-xs text-stone-400 mt-1">Take a photo of a business card</p>
            <p className="text-xs text-stone-400">AI extracts the contact info</p>
          </Link>

          {/* Download template */}
          <a
            href="/soshi-contact-template.csv"
            download
            className="block border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-stone-400 transition-colors bg-white"
          >
            <Download className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-600">Download Template</p>
            <p className="text-xs text-stone-400 mt-1">Get a CSV template with</p>
            <p className="text-xs text-stone-400">the correct column headers</p>
          </a>
        </div>
      </div>
    );
  }

  // --- Parsing view ---
  if (stage === 'parsing') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-stone-900">Import Contacts</h1>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full mx-auto mb-3" />
          <p className="text-sm text-stone-500">Parsing file...</p>
        </div>
      </div>
    );
  }

  // --- Done view ---
  if (stage === 'done' && result) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-stone-900">Import Contacts</h1>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-6 text-center">
          <Check className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-medium text-stone-900">Import Complete</p>
          <p className="text-sm text-stone-500 mt-1">
            {result.imported} contacts imported
            {result.errors > 0 && `, ${result.errors} skipped`}
          </p>
          <button
            onClick={reset}
            className="mt-4 px-4 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800"
          >
            Import More
          </button>
        </div>
      </div>
    );
  }

  // --- Mapping + importing view ---
  return (
    <div>
      <div className="mb-6">
        <button onClick={reset} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="text-lg font-semibold text-stone-900">Map Columns</h1>
        <p className="text-sm text-stone-500 mt-0.5">{rows.length} rows found &middot; {headers.length} columns</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-4">
        {/* Column mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {FIELD_MAPPINGS.map(field => (
            <div key={field.target} className="flex items-center gap-2">
              <label className="text-xs text-stone-500 w-28 flex-shrink-0">
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
            disabled={stage === 'importing' || !mappings.first_name}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
          >
            {stage === 'importing' ? `Importing... (${rows.length} rows)` : `Import ${rows.length} Contacts`}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 text-stone-500 text-sm hover:text-stone-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
