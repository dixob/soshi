'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cn, formatDate, contactName } from '@/lib/utils';
import { Plus, Heart, ArrowRightLeft, Check, SkipForward, Phone, Mail, FileText } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import type { AftercareTouchpoint, AftercareCase } from '@/types/database';
import { AftercareSkeleton } from '@/components/PageSkeleton';

export default function AftercarePage() {
  const { aftercareCases, contacts, dataLoading, createAftercareCase, updateTouchpoint, convertToProspect } = useStore();
  const [showNew, setShowNew] = useState(false);

  // New case form
  const [contactId, setContactId] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [saving, setSaving] = useState(false);

  const activeCases = aftercareCases.filter(c => c.status === 'active');
  const completedCases = aftercareCases.filter(c => c.status !== 'active');

  // Count overdue touchpoints
  const overdueCount = activeCases.reduce((acc, c) => {
    return acc + (c.touchpoints?.filter(tp =>
      tp.status === 'pending' && differenceInDays(new Date(), parseISO(tp.due_date)) > 0
    ).length || 0);
  }, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createAftercareCase(contactId, deceasedName, serviceDate);
    setContactId('');
    setDeceasedName('');
    setServiceDate('');
    setShowNew(false);
    setSaving(false);
  }

  if (dataLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-5 w-24 bg-stone-100 rounded animate-pulse" />
            <div className="h-3.5 w-36 bg-stone-50 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <AftercareSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Aftercare</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {activeCases.length} active cases
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium"> &middot; {overdueCount} overdue touchpoints</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* New case form */}
      {showNew && (
        <form onSubmit={handleCreate} className="bg-white border border-stone-200 rounded-lg p-4 mb-6 space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Create Aftercare Case</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Family Contact *</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Select contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Deceased Name *</label>
              <input
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Service Date *</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Case'}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="px-4 py-1.5 text-stone-500 text-sm hover:text-stone-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active cases */}
      <div className="space-y-4">
        {activeCases.map(ac => (
          <CaseCard
            key={ac.id}
            ac={ac}
            onUpdateTouchpoint={updateTouchpoint}
            onConvert={() => convertToProspect(ac.id)}
          />
        ))}

        {activeCases.length === 0 && !showNew && (
          <div className="text-center py-12 text-stone-400">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active aftercare cases</p>
            <p className="text-xs mt-1">Create a case when a family&apos;s service is completed</p>
          </div>
        )}
      </div>

      {/* Completed/converted */}
      {completedCases.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-stone-400 mb-3">Completed / Converted</h2>
          <div className="space-y-2">
            {completedCases.map(ac => (
              <div key={ac.id} className="bg-white border border-stone-200 rounded-lg p-3 opacity-60">
                <p className="text-sm text-stone-700">
                  {ac.deceased_name}
                  {ac.contact && <span className="text-stone-400"> — {contactName(ac.contact)}</span>}
                </p>
                <p className="text-xs text-stone-400">
                  Service {formatDate(ac.service_date)} &middot; {ac.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseCard({
  ac,
  onUpdateTouchpoint,
  onConvert,
}: {
  ac: AftercareCase;
  onUpdateTouchpoint: (id: string, data: Partial<AftercareTouchpoint>) => Promise<void>;
  onConvert: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});

  const sortedTouchpoints = [...(ac.touchpoints || [])].sort(
    (a: AftercareTouchpoint, b: AftercareTouchpoint) => a.due_date.localeCompare(b.due_date)
  );

  const name = ac.contact ? contactName(ac.contact) : 'Unknown';

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="text-sm font-medium text-stone-900">{ac.deceased_name}</p>
          <p className="text-xs text-stone-400">
            Family: {name} &middot; Service {formatDate(ac.service_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onConvert(); }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Convert family to preneed prospect"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Convert to Prospect
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3">
          <div className="space-y-3">
            {sortedTouchpoints.map((tp: AftercareTouchpoint) => {
              const overdue = tp.status === 'pending' && differenceInDays(new Date(), parseISO(tp.due_date)) > 0;
              return (
                <div key={tp.id} className={cn('flex items-start gap-3 py-2', overdue && 'bg-red-50 -mx-2 px-2 rounded')}>
                  {/* Status indicator */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    tp.status === 'completed' ? 'bg-emerald-100' :
                    tp.status === 'skipped' ? 'bg-stone-100' :
                    overdue ? 'bg-red-100' : 'bg-amber-100'
                  )}>
                    {tp.touchpoint_type === 'phone_call' && <Phone className="w-3 h-3" />}
                    {tp.touchpoint_type === 'email' && <Mail className="w-3 h-3" />}
                    {tp.touchpoint_type === 'task' && <FileText className="w-3 h-3" />}
                    {tp.touchpoint_type === 'card' && <Heart className="w-3 h-3" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm',
                        tp.status === 'completed' ? 'text-stone-400 line-through' :
                        tp.status === 'skipped' ? 'text-stone-400' : 'text-stone-700'
                      )}>
                        {tp.label}
                      </p>
                      {overdue && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      Due {formatDate(tp.due_date)}
                      {tp.note && ` — ${tp.note}`}
                      {tp.skip_reason && ` — Skipped: ${tp.skip_reason}`}
                    </p>
                  </div>

                  {/* Actions */}
                  {tp.status === 'pending' && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        value={actionNote[tp.id] || ''}
                        onChange={(e) => setActionNote({ ...actionNote, [tp.id]: e.target.value })}
                        placeholder="Note..."
                        className="w-20 sm:w-24 px-2 py-1.5 border border-stone-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTouchpoint(tp.id, {
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                            note: actionNote[tp.id] || null,
                          });
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors active:bg-emerald-100"
                        title="Mark complete"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTouchpoint(tp.id, {
                            status: 'skipped',
                            skip_reason: actionNote[tp.id] || 'Skipped',
                          });
                        }}
                        className="p-2 text-stone-400 hover:bg-stone-50 rounded-md transition-colors active:bg-stone-100"
                        title="Skip"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
