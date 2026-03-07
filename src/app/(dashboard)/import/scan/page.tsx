'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import ContactForm from '@/components/ContactForm';
import { Camera, Upload, ArrowLeft, AlertTriangle, RotateCcw } from 'lucide-react';
import type { Contact } from '@/types/database';

interface ScanResult {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  communication_pref: string | null;
  relationship_notes: string | null;
  confidence: 'high' | 'medium' | 'low';
  raw_text: string;
}

type Stage = 'capture' | 'processing' | 'review';

export default function ScanPage() {
  const router = useRouter();
  const { createContact } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('capture');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  async function processImage(file: File) {
    setError(null);
    setStage('processing');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/scan-contact', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to scan image' }));
        throw new Error(err.error || 'Failed to scan image');
      }

      const result: ScanResult = await res.json();
      setScanResult(result);
      setStage('review');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to scan image');
      setStage('capture');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = '';
  }

  function resetScan() {
    setStage('capture');
    setImagePreview(null);
    setScanResult(null);
    setError(null);
    setShowRawText(false);
  }

  async function handleSave(data: Partial<Contact>) {
    await createContact(data);
    router.push('/contacts');
  }

  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => router.push('/import')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Import
        </button>
        <h1 className="text-lg font-semibold text-stone-900">Scan a Card</h1>
        <p className="text-sm text-stone-500 mt-0.5">Take a photo of a business card, Rolodex card, or letter</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Capture stage */}
      {stage === 'capture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => cameraRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-stone-400 transition-colors bg-white"
          >
            <Camera className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-600">Take Photo</p>
            <p className="text-xs text-stone-400 mt-1">Use your camera</p>
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-stone-400 transition-colors bg-white"
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-600">Upload Photo</p>
            <p className="text-xs text-stone-400 mt-1">Choose from files</p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Processing stage */}
      {stage === 'processing' && (
        <div className="bg-white border border-stone-200 rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {imagePreview && (
              <img src={imagePreview} alt="Scanned card" className="w-48 h-32 object-cover rounded-lg border border-stone-200" />
            )}
            <div className="text-center md:text-left">
              <div className="animate-spin w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full mx-auto md:mx-0 mb-2" />
              <p className="text-sm text-stone-500">Extracting contact information...</p>
            </div>
          </div>
        </div>
      )}

      {/* Review stage */}
      {stage === 'review' && scanResult && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Image preview */}
            {imagePreview && (
              <div className="md:w-48 flex-shrink-0">
                <img src={imagePreview} alt="Scanned card" className="w-full h-32 object-cover rounded-lg border border-stone-200" />
              </div>
            )}

            {/* Confidence + actions */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[scanResult.confidence]}`}>
                  {scanResult.confidence} confidence
                </span>
                <button onClick={resetScan} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700">
                  <RotateCcw className="w-3 h-3" />
                  Scan Another
                </button>
              </div>

              {scanResult.raw_text && (
                <div>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-xs text-stone-400 hover:text-stone-600"
                  >
                    {showRawText ? 'Hide' : 'Show'} raw text
                  </button>
                  {showRawText && (
                    <pre className="mt-1 text-xs text-stone-500 bg-stone-50 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {scanResult.raw_text}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pre-filled form */}
          <ContactForm
            title="Review & Save Contact"
            initial={{
              first_name: scanResult.first_name || '',
              last_name: scanResult.last_name || '',
              phone: scanResult.phone,
              email: scanResult.email,
              address: scanResult.address,
              communication_pref: scanResult.communication_pref,
              relationship_notes: scanResult.relationship_notes,
            }}
            onSave={handleSave}
            onCancel={resetScan}
          />
        </div>
      )}
    </div>
  );
}
