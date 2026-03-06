'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { Building2, User, Users, ArrowRight, Upload, CheckCircle } from 'lucide-react';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { org, profile, updateOrg, updateProfile, createContact } = useStore();
  const { success, error } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 fields
  const [firmName, setFirmName] = useState(org?.name || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');

  // Step 2 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // ─── Step 1: firm + name ───────────────────────────────────────────────────

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!firmName.trim() || !fullName.trim()) return;
    setSaving(true);
    try {
      await Promise.all([
        updateOrg({ name: firmName.trim() }),
        updateProfile({ full_name: fullName.trim() }),
      ]);
      setStep(2);
    } catch {
      error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Step 2: first contact ─────────────────────────────────────────────────

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    try {
      await createContact({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      success(`${firstName} added to your contacts`);
      setStep(3);
    } catch {
      error('Failed to add contact. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function skipToStep3() {
    setStep(3);
  }

  // ─── Step 3: done ──────────────────────────────────────────────────────────

  function goToPipeline() {
    router.push('/pipeline');
  }

  function goToDashboard() {
    router.push('/dashboard');
  }

  // ─── Progress dots ────────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Your account' },
    { n: 2, label: 'First contact' },
    { n: 3, label: "You're set" },
  ];

  return (
    <div className="w-full max-w-md">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                ${step > s.n ? 'bg-emerald-500 text-white' :
                  step === s.n ? 'bg-stone-900 text-white' :
                  'bg-stone-200 text-stone-500'}`}
              >
                {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-xs hidden sm:block transition-colors
                ${step === s.n ? 'text-stone-700 font-medium' : 'text-stone-400'}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px w-8 ${step > s.n ? 'bg-emerald-300' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Building2 className="w-5 h-5 text-stone-600" />
            </div>
            <h1 className="text-xl font-semibold text-stone-900">Welcome to Soshi</h1>
          </div>
          <p className="text-stone-500 text-sm mb-6 ml-[52px]">
            Let&apos;s set up your account — takes about 2 minutes.
          </p>

          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Firm name
              </label>
              <input
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="Johnson Family Funeral Home"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Your name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kyle Johnson"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !firmName.trim() || !fullName.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Users className="w-5 h-5 text-stone-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Add your first contact</h2>
          </div>
          <p className="text-stone-500 text-sm mb-6 ml-[52px]">
            Start with one person — you can import a full list later.
          </p>

          <form onSubmit={handleStep2} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">First name *</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Margaret"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Thompson"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
                type="tel"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="margaret@example.com"
                type="email"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !firstName.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding...' : (
                  <>Add Contact <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          {/* Import CSV option */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 text-center mb-3">or import your existing list</p>
            <a
              href="/import"
              className="flex items-center justify-center gap-2 w-full py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </a>
          </div>

          <button
            onClick={skipToStep3}
            className="mt-3 w-full py-1.5 text-stone-400 text-sm hover:text-stone-600 transition-colors text-center"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">You&apos;re all set!</h2>
          <p className="text-stone-500 text-sm mb-6">
            Your account is ready. Start tracking preneed prospects in the pipeline, or explore your dashboard.
          </p>

          <div className="space-y-2">
            <button
              onClick={goToPipeline}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Go to Pipeline <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={goToDashboard}
              className="w-full py-2.5 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
